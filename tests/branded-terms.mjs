import assert from 'node:assert/strict';
import {policyPage} from '../public/modules/policies.mjs';
const ui={s:(en)=>en,link:(href,text)=>`<a href="${href}">${text}</a>`};
const details={legalName:'Registered Example ENK',address:'Example street 123',organisationNumber:'123456789',contactEmail:'business@example.test'};
const terms=policyPage(ui,'terms',details),business=policyPage(ui,'business-information',details);
assert(terms.includes('Heartfold Ink'));assert(!terms.includes(details.address));assert(!terms.includes(details.legalName));assert(terms.includes('/business-information/'));
assert(business.includes(details.address));assert(business.includes(details.legalName));assert(business.includes(details.organisationNumber));
const untrusted=policyPage(ui,'business-information',{...details,legalName:'<script>alert(1)</script>'});assert(!untrusted.includes('<script>'));assert(untrusted.includes('&lt;script&gt;'));
console.log('Terms use Heartfold Ink branding, link seller details, and keep registered identity on a separate escaped business page.');
