"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentPortfolioLinksAction } from "@/lib/actions/update-own-talent-portfolio-links";
import { isValidLocale, type Locale } from "@/lib/i18n";

type TalentRecord = Record<string, unknown> & {
  showreel_url?: string | null;
  video_intro?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  portfolio_url?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function TalentPortfolioLinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [showreelUrl, setShowreelUrl] = useState("");
  const [videoIntro, setVideoIntro] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const talent = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
      if (!talent) throw new Error(isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile was not found.");
      setShowreelUrl(clean(talent.showreel_url));
      setVideoIntro(clean(talent.video_intro));
      setInstagram(clean(talent.instagram));
      setTiktok(clean(talent.tiktok));
      setSnapchat(clean(talent.snapchat));
      setPortfolioUrl(clean(talent.portfolio_url));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : isArabic ? "تعذر تحميل الروابط." : "Unable to load links.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const form = new FormData();
    form.set("locale", locale);
    form.set("showreel_url", showreelUrl);
    form.set("video_intro", videoIntro);
    form.set("instagram", instagram);
    form.set("tiktok", tiktok);
    form.set("snapchat", snapchat);
    form.set("portfolio_url", portfolioUrl);

    const result = await updateOwnTalentPortfolioLinksAction(form);
    setMessage(result.message);
    setSuccess(result.success);
    setSaving(false);
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white"><div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-10 w-64 rounded-xl bg-white/5"/><div className="h-96 rounded-[2rem] bg-white/[0.03]"/></div></main>;
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">{isArabic ? "تعذر فتح روابط معرضك" : "Unable to open portfolio links"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError}</p>
          <button onClick={() => void load()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">{isArabic ? "إعادة المحاولة" : "Try again"}</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "معرض الأعمال" : "PORTFOLIO"}</p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">{isArabic ? "الفيديو وروابطك المهنية" : "Video & professional links"}</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">{isArabic ? "مكان واحد لكل المواهب لإضافة Showreel وروابط الأعمال وحسابات السوشيال ميديا. جميعها اختيارية ولا تمنع اعتماد الملف." : "One place for every talent type to add a showreel, work links and social profiles. All are optional and never block approval."}</p>
          </div>
          <Link href={`/${locale}/talent-dashboard/gallery`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">{isArabic ? "رجوع" : "Back"}</Link>
        </div>

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "الفيديو والأعمال" : "VIDEO & WORK"}</p>
            <div className="mt-5 grid gap-5">
              <Field label={isArabic ? "رابط Showreel" : "Showreel URL"} hint={isArabic ? "YouTube أو Vimeo أو أي رابط مشاهدة مباشر" : "YouTube, Vimeo or another direct viewing link"}>
                <input type="url" value={showreelUrl} onChange={(e) => setShowreelUrl(e.target.value)} placeholder="https://..." dir="ltr" className="input text-left" />
              </Field>
              <Field label={isArabic ? "فيديو تعريفي" : "Intro video"} hint={isArabic ? "رابط فيديو قصير يعرّف بك" : "A short video introducing yourself"}>
                <input type="url" value={videoIntro} onChange={(e) => setVideoIntro(e.target.value)} placeholder="https://..." dir="ltr" className="input text-left" />
              </Field>
              <Field label={isArabic ? "رابط بورتفوليو خارجي" : "External portfolio"}>
                <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." dir="ltr" className="input text-left" />
              </Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "السوشيال ميديا" : "SOCIAL MEDIA"}</p>
            <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "أضف فقط الحسابات المهنية التي تريد أن تراها الجهات." : "Add only the professional accounts you want publishers to see."}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Instagram"><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." dir="ltr" className="input text-left" /></Field>
              <Field label="TikTok"><input type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." dir="ltr" className="input text-left" /></Field>
              <Field label="Snapchat"><input type="url" value={snapchat} onChange={(e) => setSnapchat(e.target.value)} placeholder="https://snapchat.com/add/..." dir="ltr" className="input text-left" /></Field>
            </div>
          </section>

          {message ? <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:opacity-50">{saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ الروابط" : "Save links")}</button>
            <Link href={`/${locale}/talent-dashboard/gallery`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:text-gold">{isArabic ? "إلغاء" : "Cancel"}</Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input { width:100%; min-height:3.5rem; border-radius:1rem; border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.3); padding:.75rem 1rem; color:white; outline:none; }
        .input:focus { border-color:rgba(197,160,89,.55); }
      `}</style>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs text-white/50">{label}</span>{children}{hint ? <span className="mt-2 block text-[11px] text-white/30">{hint}</span> : null}</label>;
}
