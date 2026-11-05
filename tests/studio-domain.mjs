import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('public/site-domain.json','utf8'));
assert.equal(d.hostname,'heartfoldink.com');assert.equal(d.apexAddresses.length,2);assert.equal(d.verification.length,2);assert(d.additionalHosts.some(x=>x.hostname==='www.heartfoldink.com'&&x.cnameTarget));assert(d.verification.every(x=>x.record_type==='TXT'&&x.name.endsWith('heartfoldink.com')));
console.log('Domain configuration: root and www routing plus exact hosting verification records retained.');
