import {publicPages} from '../site-pages';
import {websiteConfig} from '../commerce/website';
export const dynamic='force-dynamic';
export async function GET(){const config=await websiteConfig();const paths=[...new Set([...publicPages,...Object.keys(config.articles||{}).map(slug=>'/guides/'+slug+'/')])];return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(path=>'<url><loc>https://heartfoldink.com'+path+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}})}
