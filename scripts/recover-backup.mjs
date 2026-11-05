// Offline recovery only. This command cannot overwrite the hosted store.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
export function recoverBackup(snapshot,destination){
 if(snapshot.format!=='heartfold-ink-backup-v1'||!snapshot.tables||!Array.isArray(snapshot.files))throw Error('Unrecognised backup format');
 if(fs.existsSync(destination))throw Error('Choose a new destination directory');
 const allowed=['business_settings','orders','order_files','attachments','support_tickets','customer_preferences','saved_requests','payment_events','mail_outbox'];
 for(const name of Object.keys(snapshot.tables))if(!allowed.includes(name))throw Error('Unrecognised table');
 const fileKeys=new Set();for(const file of snapshot.files){if(typeof file.key!=='string'||!file.key||file.key.includes('\\')||file.key.startsWith('/')||file.key.split('/').some(x=>!x||x==='.'||x==='..')||fileKeys.has(file.key))throw Error('Unsafe or duplicate file key');fileKeys.add(file.key);const bytes=Buffer.from(file.base64,'base64');if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('File integrity check failed')}
 for(const row of [...(snapshot.tables.attachments||[]),...(snapshot.tables.order_files||[])])if(!fileKeys.has(row.object_key))throw Error('A referenced file is missing');
 fs.mkdirSync(destination,{recursive:false,mode:0o700});const db=new DatabaseSync(path.join(destination,'heartfold.sqlite'));
 try{const migrations=new URL('../drizzle/',import.meta.url);for(const file of fs.readdirSync(migrations).filter(x=>x.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL(file,migrations),'utf8'));db.exec('BEGIN');for(const table of allowed){const columns=new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name));for(const row of snapshot.tables[table]||[]){const keys=Object.keys(row);if(!keys.length||keys.some(k=>!columns.has(k)))throw Error('Backup contains an unknown column');const q=db.prepare(`INSERT INTO ${table} (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map(()=>'?').join(',')})`);q.run(...keys.map(k=>row[k]))}}db.exec('COMMIT')}finally{db.close()}
 for(const file of snapshot.files){const target=path.join(destination,'private-files',file.key);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});fs.writeFileSync(target,Buffer.from(file.base64,'base64'),{mode:0o600})}
 return destination;
}
if(process.argv[1]===new URL(import.meta.url).pathname){const [input,destination]=process.argv.slice(2);if(!input||!destination)throw Error('Usage: node scripts/recover-backup.mjs BACKUP.json NEW_DIRECTORY');recoverBackup(JSON.parse(fs.readFileSync(input,'utf8')),path.resolve(destination));console.log('Offline recovery completed. Nothing was changed on the live website.');}
