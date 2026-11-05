import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {isOwner,json} from '../../../commerce/business';
export const dynamic='force-dynamic';
// A portable private snapshot. The owner downloads it; it is never put in public assets.
const tables=['business_settings','orders','order_files','attachments','support_tickets','customer_preferences','saved_requests','payment_events','mail_outbox'];
export async function GET(){
 if(!isOwner(await getChatGPTUser()))return json({error:'Owner sign-in is required.'},403);
 const startedAt=new Date().toISOString(),data:Record<string,any[]>={},files:any[]=[];let bytes=0;
 for(const table of tables){const r=await env.DB!.prepare(`SELECT * FROM ${table} LIMIT 10001`).all();if(r.results.length>10000)return json({error:'This store exceeds the portable backup limit. Arrange a managed backup; no partial backup was created.'},413);data[table]=r.results;bytes+=new TextEncoder().encode(JSON.stringify(r.results)).length;if(bytes>12*1024*1024)return json({error:'The snapshot exceeds the portable backup limit. No partial backup was created.'},413)}
 const keys=[...new Set([...(data.attachments||[]),...(data.order_files||[])].map(row=>row.object_key))];
 for(const key of keys){const object=await env.BUCKET!.get(key);if(!object)return json({error:'A referenced file is unavailable. The backup was stopped rather than silently omitting it.'},409);if(bytes+object.size>12*1024*1024)return json({error:'The files exceed the portable backup limit. Arrange a managed backup; no partial backup was created.'},413);const buffer=await object.arrayBuffer(),content=new Uint8Array(buffer);bytes+=content.length;let binary='';for(let i=0;i<content.length;i+=8192)binary+=String.fromCharCode(...content.subarray(i,i+8192));const hash=await crypto.subtle.digest('SHA-256',buffer);files.push({key,bytes:content.length,sha256:Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join(''),base64:btoa(binary)})}
 const finishedAt=new Date().toISOString();return new Response(JSON.stringify({format:'heartfold-ink-backup-v1',startedAt,finishedAt,consistency:'Captured sequentially. Pause commissions and avoid owner updates while making a recovery snapshot.',tables:data,files}),{headers:{'Content-Type':'application/json','Content-Disposition':`attachment; filename="heartfold-ink-backup-${finishedAt.slice(0,10)}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
