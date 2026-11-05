export const dynamic='force-dynamic';
import {websiteConfig} from '../commerce/website';
import Storefront from '../storefront';
import {pageDetails} from '../site-pages';
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}){const {slug=[]}=await params,path=slug.length?'/'+slug.join('/')+'/':'/',page=pageDetails(path),config=await websiteConfig(),product=config.products?.[slug[1]],article=config.articles?.[slug[1]]?.en;if(slug[0]==='commission'&&product){page.title=product.name[0];page.description=product.desc[0]}if(slug[0]==='guides'&&article){page.title=article.title;page.description=article.intro}if(!slug.length&&config.pages){page.title=config.pages.homeHeading[0];page.description=config.pages.homeIntro[0]}return {title:page.title+' · Heartfold Ink',description:page.description,alternates:{canonical:'https://heartfoldink.com'+path},robots:page.privatePage?{index:false,follow:false}:undefined,openGraph:{title:page.title+' · Heartfold Ink',description:page.description,url:'https://heartfoldink.com'+path,type:'website'}}}
export default function Page(){return <Storefront/>}
