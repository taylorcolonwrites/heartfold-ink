import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {isOwner,getBusiness,json} from '../../../commerce/business';
export const dynamic='force-dynamic';
// Explicit tables only. Runtime secrets, authentication headers and session data never enter the export.
export async function GET(){
 const user=await getChatGPTUser();if(!isOwner(user))return json({error:'Owner sign-in is required.'},403);
 const settings=await getBusiness(),tables:Record<string,unknown[]>={},truncated:string[]=[];
 for(const table of ['orders','support_tickets','order_files','attachments']){
  const {results}=await env.DB!.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 1001`).all();
  if(results.length>1000)truncated.push(table);tables[table]=results.slice(0,1000);
 }
 const createdAt=new Date().toISOString();
 return new Response(JSON.stringify({format:'heartfold-ink-records-v1',createdAt,complete:truncated.length===0,truncatedTables:truncated,limitations:['File metadata only; file contents are not included.','Not a database restore archive.','At most 1000 records per table.'],settings,tables},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="heartfold-ink-records-${createdAt.slice(0,10)}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
