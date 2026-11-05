import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{DatabaseSync}=require('node:sqlite');
// Reuse the validated recovery implementation, whose migrations are relative to it.
const {recoverBackup}=await import('./recover-backup.mjs');
const [input,destination]=process.argv.slice(2);if(!input||!destination)throw Error('Usage: node import-backup.mjs PRIVATE_SNAPSHOT.json NEW_DATA_DIRECTORY');
const target=path.resolve(destination),snapshot=JSON.parse(fs.readFileSync(input,'utf8'));const accounts=snapshot.independentAccounts||[];if(!Array.isArray(accounts)||accounts.some(a=>typeof a.email!=='string'||!/^\S+@\S+\.\S+$/.test(a.email)||typeof a.user_id!=='string'||!a.user_id||a.user_id.length>255||typeof a.created_at!=='string'))throw Error('Invalid independent account data');recoverBackup(snapshot,target);
const db=new DatabaseSync(path.join(target,'heartfold.sqlite'));try{db.exec("CREATE TABLE IF NOT EXISTS local_accounts(email TEXT PRIMARY KEY,user_id TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL)");for(const a of accounts)db.prepare('INSERT INTO local_accounts VALUES (?,?,?)').run(a.email,a.user_id,a.created_at);const row=db.prepare("SELECT payload FROM business_settings WHERE id='business'").get();if(row){const b=JSON.parse(row.payload);Object.assign(b,{acceptingRequests:false,domainConnected:false,customerAccessReviewed:false,recoveryTested:false,launchTested:false,policiesReviewed:false});db.prepare("UPDATE business_settings SET payload=? WHERE id='business'").run(JSON.stringify(b))}db.prepare("UPDATE mail_outbox SET status='uncertain',error='Imported message: verify delivery with the previous provider before resending.' WHERE status IN ('pending','sending')").run();}finally{db.close()}
console.log('Imported into a NEW directory. Requests are paused; old emails will not be resent automatically. No hosted data or DNS was changed.');
