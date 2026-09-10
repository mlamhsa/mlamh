import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Sparkles } from "lucide-react";

import { createCastingWorkspaceProjectAction } from "@/lib/actions/casting-workspace-actions";

export default async function NewWorkspaceProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="pb-24 lg:pb-10">
      <div className="mx-auto max-w-4xl">
        <Link href={`/${locale}/publisher-dashboard/workspace`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
          <ArrowLeft size={16} className={isArabic ? "rotate-180" : ""} />
          {isArabic ? "العودة إلى مساحة العمل" : "Back to workspace"}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.08] text-gold"><BriefcaseBusiness size={21} /></div>
          <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-gold">CASTING BRIEF</p>
          <h1 className="mt-3 text-3xl font-light sm:text-5xl">{isArabic ? "حوّل احتياجك إلى مشروع كاستينغ" : "Turn your brief into a casting project"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">{isArabic ? "ابدأ بأول دور فقط. بعد إنشاء المشروع يمكنك إضافة أدوار أخرى ومقارنة توفر المواهب لكل دور." : "Start with the first role. After creating the project, you can add more roles and compare talent supply for each one."}</p>
        </header>

        <form action={createCastingWorkspaceProjectAction} className="mt-6 space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8">
          <input type="hidden" name="locale" value={locale} />

          <section>
            <p className="text-xs font-medium text-gold">01 · {isArabic ? "المشروع" : "Project"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={isArabic ? "اسم المشروع" : "Project name"} required>
                <input className="field" name="projectTitle" required placeholder={isArabic ? "مثال: حملة إطلاق منتج" : "e.g. Product launch campaign"} />
              </Field>
              <Field label={isArabic ? "تاريخ العمل" : "Work date"}>
                <input className="field" name="workDate" type="date" />
              </Field>
            </div>
            <Field label={isArabic ? "ملخص البريف" : "Brief summary"} className="mt-4">
              <textarea className="field min-h-28 resize-none" name="summary" placeholder={isArabic ? "ما المشروع؟ وما النتيجة التي تريد الوصول إليها؟" : "What is the project and what outcome do you need?"} />
            </Field>
          </section>

          <section className="border-t border-white/10 pt-6">
            <p className="text-xs font-medium text-gold">02 · {isArabic ? "الدور الأول" : "First role"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={isArabic ? "اسم الدور" : "Role name"} required>
                <input className="field" name="roleName" required placeholder={isArabic ? "مثال: مودل للحملة الرئيسية" : "e.g. Lead campaign model"} />
              </Field>
              <Field label={isArabic ? "نوع الموهبة" : "Talent type"} required>
                <select className="field" name="talentType" required defaultValue="model">
                  <option value="model">{isArabic ? "مودل" : "Model"}</option>
                  <option value="actor">{isArabic ? "ممثل" : "Actor"}</option>
                </select>
              </Field>
              <Field label={isArabic ? "المدينة" : "City"}>
                <input className="field" name="city" placeholder={isArabic ? "مثال: الرياض" : "e.g. Riyadh"} />
              </Field>
              <Field label={isArabic ? "العدد المطلوب" : "Needed talent"} required>
                <input className="field" name="requiredCount" type="number" min="1" max="1000" defaultValue="1" required />
              </Field>
              <Field label={isArabic ? "الجنس — اختياري" : "Gender — optional"}>
                <select className="field" name="gender" defaultValue="">
                  <option value="">{isArabic ? "غير محدد" : "Any"}</option>
                  <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                  <option value="female">{isArabic ? "أنثى" : "Female"}</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={isArabic ? "العمر من" : "Age min"}><input className="field" name="ageMin" type="number" min="1" max="100" /></Field>
                <Field label={isArabic ? "العمر إلى" : "Age max"}><input className="field" name="ageMax" type="number" min="1" max="100" /></Field>
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 pt-6">
            <p className="text-xs font-medium text-gold">03 · {isArabic ? "الميزانية والمتطلبات" : "Budget & requirements"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <Field label={isArabic ? "ميزانية من" : "Budget min"}><input className="field" name="budgetMin" type="number" min="0" /></Field>
              <Field label={isArabic ? "ميزانية إلى" : "Budget max"}><input className="field" name="budgetMax" type="number" min="0" /></Field>
              <Field label={isArabic ? "العملة" : "Currency"}><input className="field uppercase" name="currency" defaultValue="SAR" maxLength={3} /></Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={isArabic ? "الصفات المطلوبة" : "Desired traits"}><input className="field" name="traits" placeholder={isArabic ? "مثال: أسلوب رياضي، حضور طبيعي" : "e.g. athletic, natural presence"} /></Field>
              <Field label={isArabic ? "ملاحظات الدور" : "Role notes"}><input className="field" name="notes" placeholder={isArabic ? "أي تعليمات إضافية" : "Any additional instructions"} /></Field>
            </div>
          </section>

          <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] p-4 text-xs leading-6 text-white/55">
            <span className="inline-flex items-center gap-2 text-gold"><Sparkles size={14} />{isArabic ? "بعد الإنشاء" : "After creation"}</span>
            <p className="mt-2">{isArabic ? "ستعرض ملامح حجم المواهب المطابقة للدور مباشرة، دون تقديم أي موهبة تلقائيًا أو اتخاذ قرار نيابة عنك." : "MLAMH will show matching talent supply for the role without auto-applying anyone or making decisions on your behalf."}</p>
          </div>

          <button className="min-h-13 w-full rounded-full bg-gold px-6 py-4 text-sm font-medium text-black transition hover:bg-gold-soft">{isArabic ? "إنشاء مساحة المشروع" : "Create project workspace"}</button>
        </form>
      </div>
      <style>{`.field{width:100%;min-height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);padding:12px 14px;color:white;outline:none}.field:focus{border-color:rgba(205,170,90,.55)}.field option{background:#111;color:white}`}</style>
    </div>
  );
}

function Field({ label, children, required = false, className = "" }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-xs text-white/50">{label}{required ? <span className="ms-1 text-gold">*</span> : null}</span>{children}</label>;
}
