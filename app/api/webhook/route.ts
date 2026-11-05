import {env} from 'cloudflare:workers';
import {runtime,json,notifyOrder,flushMail,stripeMode} from '../../commerce/business';
import {validSignature} from '../../commerce/webhook';
import {todayInOslo} from '../../../public/order-policy.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){const secret=runtime().STRIPE_WEBHOOK_SECRET;if(!secret)return json({error:'Webhook not configured'},503);const raw=await req.text();if(raw.length>300000||!await validSignature(raw,req.headers.get('stripe-signature')||'',secret))return json({error:'Invalid signature'},400);let event:any;try{event=JSON.parse(raw)}catch{return json({error:'Invalid event'},400)}const s=event.data?.object;if(!s||typeof event.id!=='string')return json({error:'Invalid event'},400);const e=runtime();if(!stripeMode(e.STRIPE_SECRET_KEY)||event.livemode!==(stripeMode(e.STRIPE_SECRET_KEY)==='live'))return json({error:'Payment mode mismatch'},400);let row:any;
if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
 if(s.payment_status!=='paid')return json({received:true});row=await env.DB!.prepare('SELECT * FROM orders WHERE reference=?').bind(s.metadata?.reference||'').first<any>();if(!row||row.payment_session!==s.id||row.amount_minor!==s.amount_total||row.payment_currency?.toLowerCase()!==s.currency)return json({error:'Order and payment do not match'},409);
 const p=JSON.parse(row.payload),paymentDay=todayInOslo(),after=new Date(paymentDay+'T12:00:00Z');after.setUTCDate(after.getUTCDate()+14);const start=p.earlyStart?row.start_after:[row.start_after||'',after.toISOString().slice(0,10)].sort().pop();
 await env.DB!.batch([env.DB!.prepare("UPDATE orders SET status='paid',payment_intent=?,start_after=?,updated_at=? WHERE id=? AND status='awaiting_payment'").bind(s.payment_intent,start,new Date().toISOString(),row.id),env.DB!.prepare('INSERT INTO payment_events(id,order_id,created_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(event.id,row.id,new Date().toISOString())]);await notifyOrder(row,'Payment received');await flushMail();return json({received:true});
}
if(event.type==='charge.refunded'){
 row=await env.DB!.prepare('SELECT * FROM orders WHERE payment_intent=?').bind(s.payment_intent||'').first<any>();if(row&&s.amount_refunded>=s.amount&&s.refunded){await env.DB!.batch([env.DB!.prepare("UPDATE orders SET status='refunded',updated_at=? WHERE id=?").bind(new Date().toISOString(),row.id),env.DB!.prepare('INSERT INTO payment_events(id,order_id,created_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(event.id,row.id,new Date().toISOString())]);await notifyOrder(row,'Refund confirmed');await flushMail()}
}
return json({received:true})}
