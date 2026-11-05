import assert from 'node:assert/strict';
import {latestOrderDate,deliveryPlan,addBusinessDays,christmasCutoff,christmasYear,validateRequest} from '../public/order-policy.mjs';
import {catalogue,quote,matchingProducts} from '../public/modules/catalogue.mjs';
for(const target of ['2026-12-24','2027-06-18','2028-02-29','2029-01-04'])for(const key of ['letter','book'])for(const format of key==='book'?['digital']:['digital','physical'])for(const early of [true,false]){
 const item={key,words:key==='book'?10000:300,format,country:'uk'},last=latestOrderDate(item,target,early),start=new Date(last+'T12:00:00Z');if(!early)start.setUTCDate(start.getUTCDate()+14);
 assert(addBusinessDays(deliveryPlan(item,start.toISOString().slice(0,10)).earliest,format==='digital'?2:5)<=target);
 const next=addBusinessDays(last,1),after=new Date(next+'T12:00:00Z');if(!early)after.setUTCDate(after.getUTCDate()+14);
 assert(addBusinessDays(deliveryPlan(item,after.toISOString().slice(0,10)).earliest,format==='digital'?2:5)>target);
}
const item={key:'letter',words:300,format:'digital',country:'uk',occasion:'christmas',occasionDate:'2026-12-25',needBy:'2026-12-24'};
assert.equal(validateRequest(item,christmasCutoff(item,2026)),null);assert.equal(validateRequest(item,addBusinessDays(christmasCutoff(item,2026),1)),'christmas-cutoff');assert(christmasCutoff({...item,format:'physical'},2026)<christmasCutoff(item,2026));assert.equal(christmasYear('2026-12-26'),2027);assert.equal(latestOrderDate(item,'not-a-date'),null);
for(const key of ['memory','newchapter','pet','later']){assert(catalogue[key].brief.length===2);assert(catalogue[key].cta.length===2);assert(quote({key,words:catalogue[key].kind==='letter'?300:1000,format:'digital'}).total>0)}assert(!matchingProducts({recipient:'child'}).includes('memory'));
console.log('Gift planning: last-safe-date boundaries, writing/postal buffers, withdrawal delay, leap years, Christmas validation and new products passed.');
