import Link from "next/link";
import type { Locale } from "@/lib/i18n";
export function AIServiceHomeEntry({locale}:{locale:Locale}){
 const ar=locale==="ar";
 return <section dir={ar?"rtl":"ltr"} className="border-y border-amber-400/15 bg-[#0c0b09] px-5 py-14 text-white">
 <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center">
 <div><p className="text-xs font-semibold tracking-[.2em] text-amber-400">MLAMH AI</p>
 <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{ar?"خيالك أصبح إعلانًا.":"Turn imagination into a commercial."}</h2>
 <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">{ar?"إعلانات وتريلرات ومشاهد سينمائية بالذكاء الاصطناعي. أخبرنا بفكرتك وسنقدم عرضًا يناسب مشروعك.":"AI commercials, trailers and cinematic scenes. Tell us your idea and request a custom quote."}</p></div>
 <Link href={`/${locale}/services/ai-production`} className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-400 px-7 py-3 font-semibold text-black">{ar?"استكشف الخدمة":"Explore the service"}</Link>
 </div></section>;
}