import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite');
const [directory,output]=process.argv.slice(2);if(!directory||!output)throw Error('Usage: node backup.mjs PRIVATE_DATA_DIRECTORY NEW_SNAPSHOT.json (stop the app first)');
if(fs.existsSync(output))throw Error('Choose a new snapshot path.');const root=path.resolve(directory),db=new DatabaseSync(path.join(root,'heartfold.sqlite'),{readOnly:true}),tables={},files=[],independentAccounts=[],startedAt=new Date().toISOString();
try{db.exec('BEGIN');for(const table of ['business_settings','orders','order_files','attachments','support_tickets','customer_preferences','saved_requests','payment_events','mail_outbox'])tables[table]=db.prepare(`SELECT * FROM ${table}`).all();if(db.prepare("SELECT name FROM sqlite_master WHERE name='local_accounts'").get())independentAccounts.push(...db.prepare('SELECT email,user_id,created_at FROM local_accounts').all());db.exec('COMMIT')}finally{db.close()}
for(const key of new Set([...tables.attachments,...tables.order_files].map(x=>x.object_key))){if(typeof key!=='string'||key.startsWith('/')||key.includes('\\')||key.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe file key');const bytes=fs.readFileSync(path.join(root,'private-files',key));files.push({key,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')})}
fs.writeFileSync(output,JSON.stringify({format:'heartfold-ink-backup-v1',startedAt,finishedAt:new Date().toISOString(),independentAccounts,consistency:'Offline snapshot: stop the application before creating it.',tables,files}),{flag:'wx',mode:0o600});console.log('Private application snapshot created. Login sessions and password configuration are excluded.');
