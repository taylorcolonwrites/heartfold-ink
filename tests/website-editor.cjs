const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite'),{webcrypto}=require('node:crypto');
const db=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const DB={prepare(sql){let args=[];const q={bind(...a){args=a;return q},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}}};return q},async batch(queries){db.exec('BEGIN');try{const rows=[];for(const q of queries)rows.push(await q.run());db.exec('COMMIT');return rows}catch(e){db.exec('ROLLBACK');throw e}}};
let user=null;const blobs=new Map(),sessions=new Map(),sent=[];let sequence=0;const env={DB,BUCKET:{async put(k,bytes){blobs.set(k,bytes)},async get(k){return blobs.has(k)?{body:new Uint8Array(blobs.get(k)),size:blobs.get(k).byteLength,arrayBuffer:async()=>blobs.get(k)}:null},async delete(k){blobs.delete(k)}}};
const fakeFetch=async(url,opt={})=>{if(url.startsWith('https://api.stripe.com/v1/'))assert.equal(opt.headers['Stripe-Version'],'2026-02-25.clover');if(url==='https://api.resend.com/emails'){sent.push(opt.headers['Idempotency-Key']);return Response.json({id:'mail-'+sent.length})}if(!url.startsWith('https://api.stripe.com/v1/'))throw Error('Unexpected outbound request');const endpoint=url.slice('https://api.stripe.com/v1/'.length);if(endpoint==='checkout/sessions'){const data=new URLSearchParams(opt.body),id='cs_test_'+(++sequence);const s={id,status:'open',url:'https://checkout.stripe.com/c/pay/'+id,amount_total:Number(data.get('line_items[0][price_data][unit_amount]')),currency:data.get('line_items[0][price_data][currency]'),metadata:{reference:data.get('metadata[reference]')},payment_intent:'pi_'+id,payment_status:'unpaid'};sessions.set(id,s);return Response.json(s)}if(endpoint==='refunds')return Response.json({id:'re_test',status:'pending'});if(endpoint.startsWith('checkout/sessions/')){const id=endpoint.split('/')[2],s=sessions.get(id);if(endpoint.endsWith('/expire'))s.status='expired';return Response.json(s)}throw Error('Unexpected Stripe endpoint '+endpoint)};
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const api={};cache.set(file,api);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports:api,require:name=>name==='cloudflare:workers'?{env}:name.endsWith('chatgpt-auth')?{getChatGPTUser:async()=>user}:name.endsWith('.mjs')?require(path.resolve(path.dirname(file),name)):load(path.resolve(path.dirname(file),name+'.ts')),Response,Request,URL,URLSearchParams,FormData,File,AbortSignal,TextEncoder,TextDecoder,Uint8Array,Date,crypto:webcrypto,fetch:fakeFetch,btoa,console});return api}

const website=load('app/api/website/route.ts'),orders=load('app/api/orders/route.ts'),studio=load('app/api/studio/route.ts');
const {basePricing,pageDefaults,validateSection}=require('../public/modules/website-config.mjs');
const {catalogue,quote}=require('../public/modules/catalogue.mjs');
const origin='https://shop.test';
const request=(value,originHeader=origin)=>new Request(origin+'/api/website',{method:'POST',headers:{origin:originHeader,'Content-Type':'application/json'},body:JSON.stringify(value)});
const owner=()=>user={userId:'owner',email:'taylor.colon.mgmt@gmail.com'},buyer=()=>user={userId:'buyer',email:'buyer@example.test'};
(async()=>{
 const pricing=basePricing();pricing.rates.letter[300]=17.25;pricing.rates.letter[800]=24;
 assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:pricing}))).status,403);
 buyer();assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:pricing}))).status,403);
 owner();assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:pricing},'https://evil.test'))).status,403);
 const bad=basePricing();bad.rates.letter[300]=-1;assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:bad}))).status,400);
 db.prepare('INSERT INTO business_settings(id,payload) VALUES (?,?)').run('business',JSON.stringify({legalName:'Original legal identity',acceptingRequests:true,siteOrigin:origin,pricesReviewed:true,launchTested:true}));
 assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:pricing}))).status,200);
 let config=await (await website.GET()).json();assert.equal(config.pricing.rates.letter[800],24);
 const business=JSON.parse(db.prepare("SELECT payload FROM business_settings WHERE id='business'").get().payload);assert.equal(business.legalName,'Original legal identity');assert.equal(business.pricesReviewed,false);assert.equal(business.launchTested,false);
 assert.equal((await website.POST(request({section:'pricing',revision:'initial',value:basePricing()}))).status,409);
 const reviewRequest=v=>new Request(origin+'/api/studio',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(v)});
 assert.equal((await studio.POST(reviewRequest({action:'review',key:'trial',confirmed:true}))).status,400);
 assert.equal((await studio.POST(reviewRequest({action:'review',key:'constructor',confirmed:true}))).status,400);
 assert.equal((await studio.POST(reviewRequest({action:'review',key:'prices',confirmed:false}))).status,400);
 const confirmed=await studio.POST(reviewRequest({action:'review',key:'prices',confirmed:true}));assert.equal(confirmed.status,200);assert.equal((await confirmed.json()).checks.find(c=>c.key==='prices').ready,true);
 const unchanged=await website.POST(request({section:'pricing',revision:config.revision,value:pricing}));assert.equal((await unchanged.json()).unchanged,true);
 assert.equal(JSON.parse(db.prepare("SELECT payload FROM business_settings WHERE id='business'").get().payload).pricesReviewed,true);
 assert.equal((await (await website.GET()).json()).revision,config.revision);

 buyer();const body={clientKey:'11111111-1111-4111-8111-111111111111',consent:true,termsConsent:true,adultConsent:true,earlyStart:true,contact:{customerName:'Test buyer',customerEmail:'buyer@example.test'},currency:'USD',items:[{key:'letter',words:300,format:'digital',country:'uk',writingLang:'en',recipient:'Dad',sender:'Sam',brief:'A fictional birthday message.',needBy:'2027-12-01',occasionDate:'2027-12-02',priceUSD:1}]};
 assert.equal((await orders.POST(new Request(origin+'/api/orders',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}))).status,200);
 assert.equal(JSON.parse(db.prepare('SELECT payload FROM orders').get().payload).totalUSD,17.25);
 owner();pricing.rates.letter[300]=19;assert.equal((await website.POST(request({section:'pricing',revision:config.revision,value:pricing}))).status,200);
 assert.equal(JSON.parse(db.prepare('SELECT payload FROM orders').get().payload).totalUSD,17.25);
 config=await (await website.GET()).json();const products=Object.fromEntries(Object.entries(catalogue).map(([key,p])=>[key,{name:p.name,desc:p.desc,uses:p.uses,enabled:key!=='letter'}]));
 await studio.POST(reviewRequest({action:'review',key:'prices',confirmed:true}));assert.equal((await website.POST(request({section:'products',revision:config.revision,value:products}))).status,200);assert.equal(JSON.parse(db.prepare("SELECT payload FROM business_settings WHERE id='business'").get().payload).pricesReviewed,true);config=await (await website.GET()).json();assert.throws(()=>quote({key:'letter',words:300,format:'digital'},config));
 buyer();assert.equal((await orders.POST(new Request(origin+'/api/orders',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({...body,clientKey:'22222222-2222-4222-8222-222222222222'})}))).status,400);
 owner();const pages=structuredClone(pageDefaults);pages.homeHeading[0]='<img src=x onerror=alert(1)>';
 assert.equal((await website.POST(request({section:'pages',revision:config.revision,value:pages}))).status,200);
 config=await (await website.GET()).json();const guides={'new-guide':{en:{title:'A new guide',intro:'Intro',sections:[['Heading','Paragraph']]},no:{title:'Ny veiledning',intro:'Intro',sections:[['Overskrift','Avsnitt']]}}};
 assert.equal((await website.POST(request({section:'articles',revision:config.revision,value:guides}))).status,200);assert.throws(()=>validateSection('articles',{'when-to-order':guides['new-guide']}));assert.throws(()=>validateSection('unknown',{}));
 user=null;config=await (await website.GET()).json();assert.equal(config.articles['new-guide'].en.title,'A new guide');assert(!JSON.stringify(config).includes('Original legal identity'));assert(!JSON.stringify(config).includes('buyer@example.test'));
 console.log('Website editor: owner-only writes, origin checks, persistent settings, stale-write conflicts, validated added price tiers, server pricing, unchanged historical requests, product pausing and new guides passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
