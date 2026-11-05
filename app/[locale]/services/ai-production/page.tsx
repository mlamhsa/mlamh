import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIShowcase } from "@/components/services/AIShowcase";
import { AIProductionRequest } from "@/components/services/AIProductionRequest";
import { isValidLocale } from "@/lib/i18n";

const site = "https://mlamh.net";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isValidLocale(locale))return {};
 const ar=locale==="ar";
 const title=ar?"إنتاج إعلانات وفيديوهات بالذكاء الاصطناعي | ملامح":"AI Video & Advertising Production | MLAMH";
 const description=ar?"حوّل فكرتك إلى إعلان أو تريلر بالذكاء الاصطناعي. اكتشف خدمات MLAMH AI واطلب عرض سعر لمشروعك.":"Create AI-powered commercials, trailers and cinematic videos with MLAMH AI. Request a custom quote.";
 return {title,description,alternates:{canonical:`${site}/${locale}/services/ai-production`,languages:{"ar-SA":`${site}/ar/services/ai-production`,en:`${site}/en/services/ai-production`}},openGraph:{title,description,url:`${site}/${locale}/services/ai-production`},robots:{index:true,follow:true}};
}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isValidLocale(locale))notFound();
 const ar=locale==="ar";
 return <main dir={ar?"rtl":"ltr"} className="min-h-screen bg-black px-5 pb-24 pt-32 text-white lg:pt-40">
 <div className="mx-auto max-w-5xl">
 <p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-400">MLAMH AI</p>
 <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">{ar?"خيالك أصبح إعلانًا.":"Turn imagination into a commercial."}</h1>
 <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">{ar?"إعلانات تجارية، تريلرات ومشاهد سينمائية بالذكاء الاصطناعي. شاركنا فكرتك لنجهز لك عرضًا يناسب متطلباتك.":"AI-powered commercials, trailers and cinematic scenes. Share your brief and receive a tailored proposal."}</p>
 <a href="#request" className="mt-8 inline-flex rounded-full bg-amber-400 px-7 py-3 font-semibold text-black">{ar?"اطلب إنتاج مشروعك":"Request production"}</a>
 <AIShowcase locale={locale as "ar"|"en"} videos={[]} />
 <section className="mt-16 grid gap-4 md:grid-cols-3">{(ar?[["إعلانات تجارية","للمنتجات والمتاجر والعلامات التجارية"],["تريلرات","إعلانات تشويقية للمشاريع والأعمال"],["مشاهد سينمائية","محتوى بصري قصصي وإبداعي"]]:[["Commercials","Products, stores and brands"],["Trailers","Teasers for projects and campaigns"],["Cinematic scenes","Creative visual storytelling"]]).map(([name,description])=><article key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h3 className="font-semibold">{name}</h3><p className="mt-2 text-sm text-white/55">{description}</p></article>)}</section>
 <section id="request" className="mt-20 scroll-mt-28"><h2 className="text-2xl font-semibold">{ar?"اطلب إنتاج مشروعك":"Tell us about your project"}</h2><p className="mt-3 text-white/55">{ar?"لا تحتاج إلى إنشاء حساب. املأ التفاصيل وسنراجعها لتقديم عرض سعر.":"No account needed. Share your requirements for a custom quote."}</p><AIProductionRequest locale={locale as "ar"|"en"}/></section>
 </div></main>;
}