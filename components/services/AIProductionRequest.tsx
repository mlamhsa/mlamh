"use client";
import { useState, type FormEvent } from "react";
export function AIProductionRequest({locale}:{locale:"ar"|"en"}){
 const ar=locale==="ar";const [status,setStatus]=useState("");
 function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();const form=new FormData(e.currentTarget);
 const fields=["name","contact","type","duration","style","format","budget","deadline","brief","references"];
 const labels=ar?["الاسم","التواصل","النوع","المدة","الأسلوب","المقاس","الميزانية","موعد التسليم","التفاصيل","روابط مرجعية"]:fields;
 const body=fields.map((field,i)=>`${labels[i]}: ${String(form.get(field)||"")}`).join("\n");
 const subject=encodeURIComponent("MLAMH AI - Production request");
 window.location.href=`mailto:info@mlamh.net?subject=${subject}&body=${encodeURIComponent(body)}`;
 setStatus(ar?"سيُفتح تطبيق البريد لإرسال الطلب. تأكد من الضغط على إرسال.":"Your email app will open. Please send the prepared message.");
 }
 const input="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/35";
 return <form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-white/10 bg-white/[.03] p-5 md:grid-cols-2 md:p-8">
 <label className="text-sm">{ar?"الاسم":"Name"}<input name="name" required maxLength={120} className={`mt-2 ${input}`}/></label>
 <label className="text-sm">{ar?"البريد الإلكتروني أو رقم التواصل":"Email or phone"}<input name="contact" required maxLength={160} className={`mt-2 ${input}`}/></label>
 <label className="text-sm">{ar?"نوع المشروع":"Project type"}<select name="type" className={`mt-2 ${input} bg-neutral-900`}><option value="commercial">{ar?"إعلان تجاري":"Commercial"}</option><option value="trailer">{ar?"تريلر":"Trailer"}</option><option value="film">{ar?"مشهد أو فيلم":"Scene or film"}</option><option value="other">{ar?"أخرى":"Other"}</option></select></label>
 <label className="text-sm">{ar?"المدة":"Duration"}<select name="duration" className={`mt-2 ${input} bg-neutral-900`}><option>15-30s</option><option>Under 15s</option><option>30-60s</option><option>Over 60s</option></select></label>
 <label className="text-sm">{ar?"الأسلوب":"Style"}<select name="style" className={`mt-2 ${input} bg-neutral-900`}><option value="cinematic">{ar?"واقعي وسينمائي":"Realistic / cinematic"}</option><option value="animated">{ar?"كرتوني":"Animated"}</option><option value="creative">{ar?"خيالي":"Creative"}</option><option value="unsure">{ar?"أحتاج اقتراحًا":"Need guidance"}</option></select></label>
 <label className="text-sm">{ar?"مقاس الفيديو":"Video format"}<select name="format" className={`mt-2 ${input} bg-neutral-900`}><option value="vertical">9:16</option><option value="horizontal">16:9</option><option value="square">1:1</option><option value="unsure">{ar?"غير محدد":"Not sure"}</option></select></label>
 <label className="text-sm">{ar?"الميزانية التقريبية":"Estimated budget"}<select name="budget" className={`mt-2 ${input} bg-neutral-900`}><option value="quote">{ar?"أحتاج عرض سعر":"Request a quote"}</option><option value="under1000">{ar?"أقل من 1000 ريال":"Under SAR 1,000"}</option><option value="1000-3000">SAR 1,000–3,000</option><option value="3000+">{ar?"أكثر من 3000 ريال":"Over SAR 3,000"}</option></select></label>
 <label className="text-sm">{ar?"موعد التسليم المتوقع":"Preferred deadline"}<input name="deadline" type="date" className={`mt-2 ${input}`}/></label>
 <label className="text-sm md:col-span-2">{ar?"اشرح فكرتك ومتطلباتك":"Project brief"}<textarea name="brief" required maxLength={5000} rows={5} className={`mt-2 ${input}`}/></label>
 <label className="text-sm md:col-span-2">{ar?"روابط صور المنتج أو أعمال مرجعية (اختياري)":"Reference links (optional)"}<textarea name="references" rows={2} maxLength={2000} className={`mt-2 ${input}`}/></label>
 <div className="md:col-span-2"><button className="rounded-full bg-amber-400 px-8 py-3 font-semibold text-black" type="submit">{ar?"تجهيز الطلب عبر البريد":"Prepare email request"}</button><p aria-live="polite" className="mt-3 text-sm text-white/60">{status|| (ar?"سيُفتح تطبيق البريد لإرسال الطلب؛ لا يُحفظ الطلب في الموقع حاليًا.":"Opens your email app; requests are not stored on the site yet.")}</p></div>
 </form>;
}