import {getBusiness,queueMail,flushMail} from '../../commerce/business';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export const dynamic='force-dynamic';
// Verified Site owner's account, not the future customer-facing support address.
const ownerEmail='taylor.colon.mgmt@gmail.com';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const isOwner=(user:any)=>user?.email?.toLowerCase()===ownerEmail;
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user)return out({signedIn:false,tickets:[],isOwner:false});
 const inbox=new URL(req.url).searchParams.get('inbox')==='1';
 if(inbox&&!isOwner(user))return out({error:'This inbox is private.'},403);
 const query=inbox?env.DB!.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 100'):env.DB!.prepare('SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.userId);
 const {results}=await query.all();
 return out({signedIn:true,isOwner:isOwner(user),tickets:results.map((r:any)=>({id:r.id,reference:r.reference,name:r.name,email:r.email,topic:r.topic,orderReference:r.order_reference,message:r.message,reply:r.reply,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at}))});
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return out({error:'Invalid origin'},403);
 const user=await getChatGPTUser();if(!user)return out({error:'Please sign in before sending a message.'},401);
 let b;try{const raw=await req.text();if(raw.length>16000)return out({error:'Please shorten your message.'},413);b=JSON.parse(raw)}catch{return out({error:'Invalid message'},400)}
 const now=new Date().toISOString();
 if(b.action==='reply'){
  if(!isOwner(user))return out({error:'This inbox is private.'},403);
  if(typeof b.id!=='string'||typeof b.reply!=='string'||!b.reply.trim()||b.reply.length>5000)return out({error:'Write a reply of up to 5,000 characters.'},400);
  const exists=await env.DB!.prepare('SELECT id FROM support_tickets WHERE id=?').bind(b.id).first();if(!exists)return out({error:'Message not found.'},404);
  await env.DB!.prepare('UPDATE support_tickets SET reply=?,status=?,updated_at=? WHERE id=?').bind(b.reply.trim(),'answered',now,b.id).run();const ticket=await env.DB!.prepare('SELECT email,reference FROM support_tickets WHERE id=?').bind(b.id).first<any>();if(ticket){const business=await getBusiness();await queueMail(ticket.reference+':reply:'+now,ticket.email,'Heartfold Ink · Reply to '+ticket.reference,'Customer service has replied to your enquiry. Read the reply at '+business.siteOrigin+'/customer-service/');await flushMail()}return out({saved:true});
 }
 const name=typeof b.name==='string'?b.name.trim():'',email=typeof b.email==='string'?b.email.trim():'',message=typeof b.message==='string'?b.message.trim():'',orderReference=typeof b.orderReference==='string'?b.orderReference.trim():'';
 if(b.consent!==true||!name||name.length>120||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||message.length<15||message.length>5000||orderReference.length>80||!['choosing','order','delivery','change','other'].includes(b.topic)||typeof b.clientKey!=='string'||!/^[a-f0-9-]{36}$/.test(b.clientKey))return out({error:'Please complete your name, email, topic and message, and agree to save your enquiry.'},400);
 const id=user.userId+':'+b.clientKey;
 const prior=await env.DB!.prepare('SELECT reference FROM support_tickets WHERE id=? AND user_id=?').bind(id,user.userId).first();if(prior)return out(prior);
 const count=await env.DB!.prepare("SELECT COUNT(*) AS n FROM support_tickets WHERE user_id=? AND status='received'").bind(user.userId).first<{n:number}>();if((count?.n||0)>=30)return out({error:'You have 30 enquiries awaiting a reply. Please check your existing messages.'},429);
 const reference='HI-HELP-'+crypto.randomUUID().slice(0,8).toUpperCase();
 await env.DB!.prepare('INSERT INTO support_tickets(id,user_id,reference,name,email,topic,order_reference,message,reply,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,user.userId,reference,name,email,b.topic,orderReference,message,'','received',now,now).run();
 const record=await env.DB!.prepare('SELECT reference FROM support_tickets WHERE id=? AND user_id=?').bind(id,user.userId).first();const business=await getBusiness();await queueMail(reference+':support-owner',business.contactEmail||'taylor.colon.mgmt@gmail.com','Heartfold Ink · New enquiry '+reference,'A new enquiry is waiting in your private inbox: '+business.siteOrigin+'/customer-service/inbox/');await flushMail();return out(record||{reference});
}
