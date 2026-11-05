import assert from 'node:assert/strict';
import {matchingProducts,occasions,recipients} from '../public/modules/catalogue.mjs';
assert.equal(matchingProducts().length,11);
for(const recipient of ['adult','partner','parent','friend','self'])for(const occasion of Object.keys(occasions)){
 const result=matchingProducts({recipient,occasion});assert(!result.includes('magic'));assert(!result.includes('bedtime'));
}
assert(matchingProducts({recipient:'child',occasion:'christmas'}).includes('magic'));
assert(matchingProducts({recipient:'child',occasion:'christmas'}).includes('book'));
assert(!matchingProducts({recipient:'child'}).includes('love'));
assert.deepEqual(matchingProducts({recipient:'adult',occasion:'christmas',category:'letters'}),['letter','continuation','newchapter','later']);
assert.deepEqual(matchingProducts({recipient:'child',occasion:'anniversary',category:'stories'}),['story','pet']);
assert.deepEqual(matchingProducts({recipient:'child',occasion:'season',category:'books'}),['book']);
assert.deepEqual(matchingProducts({recipient:'adult',occasion:'season',category:'stories'}),['story','memory','pet']);
console.log('Shop discovery: combined filters, adult/child separation and digital book inclusion passed.');
// Follow a discovery link into the commission builder, including an invalid query.
import fs from 'node:fs';
import vm from 'node:vm';
import * as catalog from '../public/modules/catalogue.mjs';
import * as content from '../public/modules/content.mjs';
import * as planning from '../public/modules/planning.mjs';
import * as policy from '../public/order-policy.mjs';
const source=fs.readFileSync('public/modules/storefront.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/render\(\);\s*$/,'');
for(const [query,expected] of [['?occasion=christmas&recipient=child','christmas'],['?occasion=unknown&recipient=unknown','']]){
 const ctx=vm.createContext({...catalog,...content,...policy,holidayNotice:planning.christmasNotice,navigator:{language:'en-US'},Intl,URLSearchParams,location:{pathname:'/commission/magic/',search:query},localStorage:{getItem(){return null}},sessionStorage:{getItem(){return null}}});
 vm.runInContext(source,ctx);assert.equal(vm.runInContext('draft.occasion',ctx),expected);assert.equal(vm.runInContext('draft.audience',ctx),'child');assert(vm.runInContext('dates()',ctx).includes('value="christmas"'+(expected?' selected':'')));
}
console.log('Discovery links prefill a valid occasion and child audience; unknown query values are ignored.');
// Database-backed public text is escaped, and saved tiers feed product display.
{
 const ctx=vm.createContext({...catalog,...content,...policy,holidayNotice:planning.christmasNotice,navigator:{language:'en-US'},Intl,URLSearchParams,location:{pathname:'/',search:''},localStorage:{getItem(){return null}},sessionStorage:{getItem(){return null}}});
 vm.runInContext(source,ctx);
 vm.runInContext(`applyWebsiteConfig({pages:{homeHeading:['<script>bad()</script>','Overskrift'],homeIntro:['A custom introduction','Introduksjon'],aboutHeading:['About','Om'],aboutBody:['First paragraph\\n\\nSecond paragraph','Tekst']},pricing:{rates:{letter:{800:25},story:{1000:30},book:{3000:120}},currencies:{USD:1,GBP:.8,NOK:11,EUR:.95,CAD:1.4,AUD:1.55},printing:{letter:4,story:11},postage:{uk:8,usa:11,norway:5}},articles:{'new-guide':{en:{title:'<img src=x>',intro:'A new guide',sections:[['Heading','Content']]},no:{title:'Ny',intro:'Intro',sections:[['Overskrift','Tekst']]}}}})`,ctx);
 const html=vm.runInContext('home()',ctx);assert(html.includes('&lt;script&gt;bad()'));assert(!html.includes('<script>bad()'));assert.equal(vm.runInContext("quote({key:'letter',words:800,format:'digital'}).total",ctx),25);assert(vm.runInContext('guides()',ctx).includes('/guides/new-guide/'));assert(vm.runInContext('guides()',ctx).includes('&lt;img src=x&gt;'));
 assert(vm.runInContext("itemAvailable({key:'letter',words:300})",ctx)===false);
}
console.log('Saved website text is escaped, new guides are listed, and edited price tiers reach the storefront.');
