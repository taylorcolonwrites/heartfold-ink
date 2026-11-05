import assert from 'node:assert/strict';
import {addBusinessDays,deliveryPlan,validateRequest,validDate,todayInOslo} from '../public/order-policy.mjs';
const item={key:'toy',words:300,format:'digital',country:'uk',needBy:'2026-12-10',occasionDate:'2026-12-25',noOccasion:false,replyText:'',attachments:[]};
assert.equal(deliveryPlan(item,'2026-12-03').finished,'2026-12-10');
assert.equal(validateRequest(item,'2026-12-03'),null);
assert.equal(validateRequest({...item,needBy:'2026-12-04'},'2026-12-03'),'too-soon');
assert.equal(deliveryPlan({...item,format:'physical'},'2026-12-03').earliest,'2026-12-22');
assert.equal(validateRequest({...item,format:'physical',needBy:'2026-12-10'},'2026-12-03'),'too-soon');
assert.equal(validateRequest({...item,key:'continuation'},'2026-12-03'),'reply');
assert.equal(validateRequest({...item,key:'continuation',replyText:'The exact incoming reply'},'2026-12-03'),null);
assert.equal(validateRequest({...item,key:'continuation',attachments:[{id:'owned-file'}]},'2026-12-03'),null);
assert.equal(validateRequest({...item,occasionDate:'2026-12-09'},'2026-12-03'),'occasion-order');
assert.equal(validateRequest({...item,occasionDate:'',noOccasion:true},'2026-12-03'),null);
assert.equal(validateRequest({...item,format:'physical',country:'other'},'2026-12-03'),'destination');
assert.equal(addBusinessDays('2026-12-24',1),'2026-12-28');
assert.equal(validDate('2026-02-30'),false);assert.equal(todayInOslo(new Date('2026-12-03T23:30:00Z')),'2026-12-04');
console.log('Order policy: writing, dispatch, separate transit, holidays, follow-up evidence and date validation passed.');

assert.equal(validateRequest({...item,key:'book',format:'physical'},'2026-12-03'),'book-digital');
