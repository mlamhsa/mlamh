"use client";
import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
type Props = { ticketNumber: string; fields: {key:string;value:string}[]; brief: string; isArabic: boolean };
const labels:Record<string,string>={"Project type":"نوع المشروع","Duration":"المدة","Style":"الأسلوب","Format":"المقاس","Budget":"الميزانية","Deadline":"موعد التسليم","Reference links":"روابط مرجعية","Exact duration":"المدة الدقيقة","Characters":"الشخصيات","Scenes":"المشاهد","Audio":"الصوت","Script status":"حالة السيناريو","Characters and scenes":"تفاصيل الشخصيات والمشاهد"};
const values:Record<string,string>={commercial:"إعلان تجاري",trailer:"تريلر",cinematic:"سينمائي",vertical:"عمودي",horizontal:"أفقي",square:"مربع",quote:"حسب عرض السعر","Not Specified":"غير محدد"};
export default function AIExecutorHandoff({ticketNumber,fields,brief,isArabic}:Props){
 const [copied,setCopied]=useState(false);
 const summary=["ملخص تنفيذ MLAMH AI",`رقم الطلب: ${ticketNumber}`,"",...fields.map(({key,value})=>`${labels[key]??key}: ${values[value]??value}`),"","وصف الفكرة:",brief||"غير محدد","","يرجى مراجعة المتطلبات وإرسال عرض السعر والمدة المتوقعة."].join("\n");
 const inputId=`ai-handoff-${ticketNumber}`;
 async function copy(){try{await navigator.clipboard.writeText(summary);setCopied(true);}catch{const el=document.getElementById(inputId) as HTMLTextAreaElement|null;el?.focus();el?.select();}}
 return <section className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.035] p-4 sm:p-6">
 <h2 className="text-base font-semibold text-gold">{isArabic?"تسليم الطلب للمنفذ":"Executor handoff"}</h2>
 <p className="mt-1 text-xs leading-6 text-white/50">{isArabic?"ملخص جاهز للمشاركة دون بيانات اتصال العميل.":"Ready-to-share brief without client contact information."}</p>
 <div className="mt-4 flex flex-wrap gap-2">
 <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-medium text-black">{copied?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}{copied?(isArabic?"تم النسخ":"Copied"):(isArabic?"نسخ الملخص":"Copy brief")}</button>
 <a href={`https://wa.me/?text=${encodeURIComponent(summary)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm text-emerald-200"><MessageCircle className="h-4 w-4"/>{isArabic?"مشاركة واتساب":"Share via WhatsApp"}</a>
 </div>
 <label htmlFor={inputId} className="mt-4 block text-xs text-white/50">{isArabic?"نص الرسالة":"Message preview"}</label>
 <textarea id={inputId} readOnly value={summary} dir="rtl" rows={11} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/75"/>
 <p className="mt-2 text-xs text-white/40">{isArabic?"فتح واتساب لا يرسل الرسالة تلقائيًا.":"Opening WhatsApp does not send the message automatically."}</p>
 </section>;
}