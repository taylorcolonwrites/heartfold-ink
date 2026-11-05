import {env} from 'cloudflare:workers';
export async function websiteConfig(){const row=await env.DB!.prepare('SELECT payload FROM business_settings WHERE id=?').bind('website-content').first<{payload:string}>();return row?JSON.parse(row.payload):{revision:'initial'};}
