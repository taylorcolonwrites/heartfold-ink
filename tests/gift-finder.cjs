const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const catalog=require('../public/modules/catalogue.mjs'),content=require('../public/modules/content.mjs'),policy=require('../public/order-policy.mjs');
const source=fs.readFileSync('public/modules/storefront.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/render\(\);\s*$/,'');
const ctx=vm.createContext({...catalog,...content,...policy,navigator:{language:'en-US'},Intl,URLSearchParams,location:{pathname:'/help/',search:''},localStorage:{getItem(){return null},setItem(){}},sessionStorage:{getItem(){return null}},crypto:{getRandomValues:crypto.webcrypto.getRandomValues.bind(crypto.webcrypto)},Uint8Array,console});
vm.runInContext(source+`
finder={recipient:'child',occasion:'toy',style:'unsure',budget:'12',format:'digital',country:'uk',details:''};
if(recommendations()[0].key!=='magic'||recommendations()[0].total!==12)throw Error('Missing-toy recommendation');
finder={...finder,occasion:'reply'};if(recommendations()[0].key!=='continuation')throw Error('Reply recommendation');
finder={...finder,style:'book',format:'physical'};if(recommendations()[0].format!=='digital')throw Error('Books must stay digital');
if(finderSteps().find(x=>x.key==='format').options.length!==1)throw Error('Book finder delivery choices');
finder={...finder,recipient:'partner',occasion:'anniversary',style:'story',format:'digital'};if(recommendations()[0].key!=='love')throw Error('Anniversary story');
if(finderSteps()[1].options.some(x=>x[0]==='toy'))throw Error('Adult occasions');
if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestId()))throw Error('HTTP preview request id');
if(esc('<img>')!=='&lt;img&gt;')throw Error('Escaping');
console.log('Gift finder: adaptive paths, digital-only books, recommendations, HTTP checkout ID and escaping passed.');
`,ctx);
