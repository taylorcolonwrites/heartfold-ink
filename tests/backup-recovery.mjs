import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {recoverBackup} from '../scripts/recover-backup.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'heartfold-recovery-')),bytes=Buffer.from('Private fictional letter'),key='letters/test.txt';
const snapshot={format:'heartfold-ink-backup-v1',tables:{business_settings:[{id:'business',payload:'{"organisationNumber":"123456789"}'}],attachments:[{id:'file-1',user_id:'test-user',name:'test.txt',mime:'text/plain',object_key:key,created_at:'2026-11-04T00:00:00Z'}]},files:[{key,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')}]};
try{const destination=path.join(root,'recovered');recoverBackup(snapshot,destination);const db=new DatabaseSync(path.join(destination,'heartfold.sqlite'));assert.equal(db.prepare('SELECT payload FROM business_settings').get().payload,snapshot.tables.business_settings[0].payload);assert.equal(db.prepare('SELECT object_key FROM attachments').get().object_key,key);db.close();assert.equal(fs.readFileSync(path.join(destination,'private-files',key),'utf8'),bytes.toString());assert.throws(()=>recoverBackup(snapshot,destination));assert.throws(()=>recoverBackup({...snapshot,files:[{...snapshot.files[0],sha256:'bad'}]},path.join(root,'bad')));assert.throws(()=>recoverBackup({...snapshot,files:[{...snapshot.files[0],key:'../escape'}]},path.join(root,'escape')));assert.throws(()=>recoverBackup({...snapshot,files:[]},path.join(root,'missing')))}finally{fs.rmSync(root,{recursive:true,force:true})}
console.log('Backup recovery: real SQLite migrations and private-file recovery; checksum, missing-file, path traversal and overwrite protection passed.');
