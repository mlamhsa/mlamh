import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIProductionSuccessScroll } from "@/components/services/AIProductionSuccessScroll";
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
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{support_sent?:string;support_error?:string}>}){
 const {locale}=await params;if(!isValidLocale(locale))notFound();
 const ar=locale==="ar";
 const query=await searchParams;
 return <main dir={ar?"rtl":"ltr"} className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-black px-5 pb-40 pt-28 text-white lg:pb-24 lg:pt-40">
 <div className="mx-auto w-full min-w-0 max-w-5xl overflow-hidden">
 <p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-400">MLAMH AI</p>
 <h1 className="mt-5 max-w-3xl break-words text-3xl font-semibold leading-tight sm:text-4xl md:text-6xl">{ar?"خيالك أصبح إعلانًا.":"Turn imagination into a commercial."}</h1>
 <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/65">{ar?"أنت تتخيل، ونحن ننتج. شاهد نماذج فيديو توضيحية لإمكانيات الإنتاج بالذكاء الاصطناعي، ثم شاركنا فكرتك لنصمم إنتاجًا مخصصًا لهدفك وهويتك.":"You imagine it, we produce it. Explore illustrative examples of AI video possibilities, then tell us what you need for a tailored production."}</p>
 <a href="#request" className="mt-8 inline-flex rounded-full bg-amber-400 px-7 py-3 font-semibold text-black">{ar?"أخبرنا بفكرتك":"Tell us your idea"}</a>
 <AIShowcase locale={locale as "ar"|"en"} videos={[
 {id:"01",youtubeId:"yoxLhUx5iRc",src:"https://youtu.be/yoxLhUx5iRc",poster:"https://i.ytimg.com/vi/yoxLhUx5iRc/hqdefault.jpg",titleAr:"نموذج إنتاج 01",titleEn:"Production sample 01",categoryAr:"إنتاج فيديو بالذكاء الاصطناعي",categoryEn:"AI video production",duration:"1:42"},
 {id:"02",youtubeId:"Y7k-EZFI1hg",src:"https://youtu.be/Y7k-EZFI1hg",poster:"https://i.ytimg.com/vi/Y7k-EZFI1hg/hqdefault.jpg",titleAr:"نموذج إنتاج 02",titleEn:"Production sample 02",categoryAr:"إنتاج فيديو بالذكاء الاصطناعي",categoryEn:"AI video production",duration:"1:22"},
 {id:"03",youtubeId:"UK_u0zRvKC8",src:"https://youtu.be/UK_u0zRvKC8",poster:"https://i.ytimg.com/vi/UK_u0zRvKC8/hqdefault.jpg",titleAr:"نموذج إنتاج 03",titleEn:"Production sample 03",categoryAr:"إنتاج فيديو بالذكاء الاصطناعي",categoryEn:"AI video production",duration:"1:08"}
 ]} />
 <section className="mt-9 grid min-w-0 grid-cols-1 gap-4 sm:mt-12 md:grid-cols-3">{(ar?[["إعلانات تجارية","للمنتجات والمتاجر والعلامات التجارية"],["تريلرات","إعلانات تشويقية للمشاريع والأعمال"],["مشاهد سينمائية","محتوى بصري قصصي وإبداعي"]]:[["Commercials","Products, stores and brands"],["Trailers","Teasers for projects and campaigns"],["Cinematic scenes","Creative visual storytelling"]]).map(([name,description])=><article key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h3 className="font-semibold">{name}</h3><p className="mt-2 text-sm text-white/55">{description}</p></article>)}</section>
 <section id="request" className="mt-20 min-w-0 scroll-mt-36">{query.support_sent==="1"?<><AIProductionSuccessScroll/><div id="request-confirmation" role="status" tabIndex={-1} className="mx-auto w-full max-w-xl scroll-mt-44 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-8 text-center text-base font-semibold leading-8 text-white shadow-[0_0_35px_rgba(251,191,36,0.08)] sm:px-8 sm:text-lg">{ar?"تم استلام طلبكم وسيتم التواصل معكم.":"We have received your request and will contact you."}</div></>:<><h2 className="text-2xl font-semibold">{ar?"اطلب إنتاج مشروعك":"Tell us about your project"}</h2><p className="mt-3 text-white/55">{ar?"لا تحتاج إلى إنشاء حساب أو اختيار نموذج جاهز. أخبرنا بهدفك وجمهورك وفكرتك؛ سنراجع قابلية التنفيذ والتكلفة والمدة قبل الاتفاق.":"No account or preset template needed. Tell us your goal and audience; feasibility, price and timeline are confirmed after review."}</p>{query.support_error?<p role="alert" className="mt-4 text-sm text-red-300">{ar?"تعذر إرسال الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.":"Unable to submit your request. Please review your details and try again."}</p>:null}<AIProductionRequest locale={locale as "ar"|"en"}/></>}</section>
 </div></main>;
}