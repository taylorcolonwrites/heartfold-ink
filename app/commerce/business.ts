import {env} from 'cloudflare:workers';
export const stripeApiVersion='2026-02-25.clover';
export function stripeMode(key?:string):'live'|'test'|null{return /^[sr]k_live_/.test(key||'')?'live':/^[sr]k_test_/.test(key||'')?'test':null}
export const ownerEmail='taylor.colon.mgmt@gmail.com';
export const isOwner=(u:any)=>u?.email?.toLowerCase()===ownerEmail;
export const runtime=()=>env as unknown as Record<string,string>;
export const json=(x:unknown,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
export const defaults={legalName:'',organisationNumber:'',address:'',contactEmail:'taylor.colon.mgmt@gmail.com',siteOrigin:'https://heartfoldink.com',domainConnected:false,acceptingRequests:true,weeklyHours:0,pricesReviewed:false,policiesReviewed:false,launchTested:false,customerAccessReviewed:false,recoveryTested:false,revisionDays:7,revisions:1,retentionDays:180};
export async function getBusiness(){const row=await env.DB!.prepare('SELECT payload FROM business_settings WHERE id=?').bind('business').first<{payload:string}>();const settings={...defaults,...(row?JSON.parse(row.payload):{})};if(!settings.contactEmail)settings.contactEmail=defaults.contactEmail;return settings}
export function readiness(b:any,e=runtime()){return [
 {key:'business',label:'Business identity, postal address and contact email',ready:!!(b.legalName&&/^\d{9}$/.test(b.organisationNumber)&&b.address&&/^\S+@\S+\.\S+$/.test(b.contactEmail))},
 {key:'origin',label:'Purchased domain and final HTTPS website address',ready:b.domainConnected===true&&/^https:\/\/[a-z0-9.-]+$/i.test(b.siteOrigin)&&!b.siteOrigin.includes('chatgpt.site')},
 {key:'prices',label:'Final prices, VAT/tax treatment and postage reviewed',ready:b.pricesReviewed===true},
 {key:'policies',label:'Terms, privacy, revisions and cancellation reviewed',ready:b.policiesReviewed===true},
 {key:'access',label:'Customer sign-in tested and accepted for your audience',ready:b.customerAccessReviewed===true},
 {key:'recovery',label:'Database and private-file backup recovery tested',ready:b.recoveryTested===true},
 {key:'payments',label:'Live Stripe key and signed webhook configured',ready:!!(stripeMode(e.STRIPE_SECRET_KEY)==='live'&&e.STRIPE_WEBHOOK_SECRET)},
 {key:'email',label:'Verified sending domain and transactional email configured',ready:!!(e.RESEND_API_KEY&&e.MAIL_FROM&&b.contactEmail)},
 {key:'trial',label:'Complete live purchase, email, delivery and refund trial',ready:b.launchTested===true}
]}
export function canCharge(b:any,e=runtime(),ownerTrial=false){return !!(stripeMode(e.STRIPE_SECRET_KEY)==='test'&&e.STRIPE_WEBHOOK_SECRET)||readiness(b,e).filter(x=>!ownerTrial||x.key!=='trial').every(x=>x.ready)}
// Owner-facing diagnostics expose state only, never credential values.
export function connectionStatus(e=runtime()){
 return {paymentMode:stripeMode(e.STRIPE_SECRET_KEY)||'not_connected',restrictedKey:/^rk_(live|test)_/.test(e.STRIPE_SECRET_KEY||''),webhookConfigured:!!e.STRIPE_WEBHOOK_SECRET,emailConfigured:!!(e.RESEND_API_KEY&&e.MAIL_FROM)};
}
export async function queueMail(id:string,to:string,subject:string,body:string){await env.DB!.prepare('INSERT INTO mail_outbox(id,recipient,subject,body,status,error,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,to,subject,body,'pending','',new Date().toISOString()).run()}
export async function flushMail(){const e=runtime();if(!e.RESEND_API_KEY||!e.MAIL_FROM)return {sent:0,pending:true};const b=await getBusiness();const {results}=await env.DB!.prepare("SELECT * FROM mail_outbox WHERE status='pending' ORDER BY created_at LIMIT 10").all();let sent=0;for(const m of results as any[]){const claim=await env.DB!.prepare("UPDATE mail_outbox SET status='sending',error='' WHERE id=? AND status='pending'").bind(m.id).run();if(!claim.meta.changes)continue;try{const r=await fetch('https://api.resend.com/emails',{signal:AbortSignal.timeout(10000),method:'POST',headers:{Authorization:'Bearer '+e.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':m.id},body:JSON.stringify({from:e.MAIL_FROM,to:[m.recipient],reply_to:b.contactEmail||undefined,subject:m.subject,text:m.body})});if(!r.ok){await env.DB!.prepare('UPDATE mail_outbox SET status=?,error=? WHERE id=?').bind(r.status>=500||r.status===409?'uncertain':'pending','Email provider returned '+r.status,m.id).run();continue}await env.DB!.prepare("UPDATE mail_outbox SET status='sent',error='' WHERE id=?").bind(m.id).run();sent++}catch{await env.DB!.prepare("UPDATE mail_outbox SET status='uncertain',error=? WHERE id=?").bind('Delivery could not be confirmed. Inspect the provider before retrying.',m.id).run()}}return {sent}}

export async function notifyOrder(row:any,label:string){const p=JSON.parse(row.payload),b=await getBusiness();await queueMail(row.reference+':'+label,p.contact.customerEmail,'Heartfold Ink · '+row.reference+' · '+label,'Hello '+p.contact.customerName+',\n\n'+label+' for your commission '+row.reference+'.\n'+(row.customer_note||'')+'\n\nView your request and any finished files in My account:\n'+b.siteOrigin+'/account/\n\nHeartfold Ink');}
export async function stripe(path:string,method='GET',body?:URLSearchParams,id?:string){const e=runtime();if(!e.STRIPE_SECRET_KEY)throw Error('Payment account is not connected.');const r=await fetch('https://api.stripe.com/v1/'+path,{signal:AbortSignal.timeout(10000),method,headers:{Authorization:'Bearer '+e.STRIPE_SECRET_KEY,'Stripe-Version':stripeApiVersion,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(id?{'Idempotency-Key':id}:{})},...(body?{body:body.toString()}:{} )});const d=await r.json() as any;if(!r.ok)throw Error('Payment provider could not complete this action.');return d}
