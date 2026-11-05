import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwner,json} from '../../commerce/business';
import {websiteConfig} from '../../commerce/website';
import {validateSection,basePricing} from '../../../public/modules/website-config.mjs';
export const dynamic='force-dynamic';
export async function GET(){return json(await websiteConfig());}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid origin'},403);
 if(!isOwner(await getChatGPTUser()))return json({error:'Owner sign-in is required.'},403);
 let body:any;try{const raw=await req.text();if(raw.length>250000)return json({error:'Please shorten this update.'},413);body=JSON.parse(raw);}catch{return json({error:'Invalid request'},400)}
 const current=await websiteConfig();if(body.revision!==current.revision)return json({error:'The website was changed in another tab. Reload the editor before saving again.'},409);
 let value;try{value=validateSection(body.section,body.value)}catch(error){return json({error:(error as Error).message},400)}
 if(JSON.stringify(current[body.section])===JSON.stringify(value))return json({saved:true,unchanged:true,reviewReset:false,revision:current.revision});
 const pricingChanged=body.section==='pricing'&&JSON.stringify(current.pricing||basePricing())!==JSON.stringify(value);
 const next={...current,[body.section]:value,revision:crypto.randomUUID(),updatedAt:new Date().toISOString()};
 const old=JSON.stringify(current),payload=JSON.stringify(next);
 if(payload.length>350000)return json({error:'Website content is too large.'},413);
 const q=current.revision==='initial'?env.DB!.prepare('INSERT INTO business_settings(id,payload) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind('website-content',payload):env.DB!.prepare('UPDATE business_settings SET payload=? WHERE id=? AND payload=?').bind(payload,'website-content',old);
 const changes=[q];
 if(pricingChanged)changes.push(env.DB!.prepare("UPDATE business_settings SET payload=json_set(payload,'$.pricesReviewed',json('false'),'$.launchTested',json('false')) WHERE id='business' AND EXISTS (SELECT 1 FROM business_settings WHERE id='website-content' AND payload=?)").bind(payload));
 const results=await env.DB!.batch(changes);if(!results[0].meta.changes)return json({error:'Another edit was saved first. Reload before saving again.'},409);
 return json({saved:true,reviewReset:pricingChanged,revision:next.revision});
}
