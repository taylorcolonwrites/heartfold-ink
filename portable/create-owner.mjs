import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{passwordHash}=require('./runtime.cjs');
if(!process.stdin.isTTY)throw Error('Run in an interactive terminal. Do not pass a password on the command line.');
const destination=path.resolve(process.argv[2]||'.env');if(fs.existsSync(destination))throw Error('That file already exists. Choose a new private config file; no settings were overwritten.');
async function prompt(label){process.stdout.write(label);process.stdin.setRawMode(true);process.stdin.resume();return new Promise((resolve,reject)=>{let value='';const read=buffer=>{for(const c of buffer.toString()){if(c==='\u0003'){clean();reject(Error('Cancelled'));return}if(c==='\r'||c==='\n'){clean();process.stdout.write('\n');resolve(value);return}if(c==='\u007f')value=value.slice(0,-1);else if(c>=' ')value+=c;}};function clean(){process.stdin.off('data',read);process.stdin.setRawMode(false);process.stdin.pause()}process.stdin.on('data',read)})}
const password=await prompt('New owner password (at least 16 characters, hidden): ');if(password.length<16||password.length>1024)throw Error('Use a password between 16 and 1024 characters.');if(await prompt('Repeat owner password (hidden): ')!==password)throw Error('Passwords did not match.');const hash=await passwordHash(password);
fs.writeFileSync(destination,'APP_ORIGIN=https://heartfoldink.com\nDATA_DIR=./data\nHOST=127.0.0.1\nPORT=8787\nOWNER_PASSWORD_HASH=\''+hash+'\'\n',{flag:'wx',mode:0o600});console.log('Private configuration created. Only a password hash was stored. Keep this file out of source control.');
