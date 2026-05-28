"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
  startTransition,
} from "react";
import type { ReactNode } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { submitTalentAction as rawSubmitTalentAction } from "@/lib/actions/submit-talent";
import {
  initialSubmitTalentState,
  type SubmitTalentState,
} from "@/lib/actions/submit-talent-state";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { TalentSubmissionErrors } from "@/lib/validations/talent-submission";

const MAX_GALLERY_IMAGES = 1;
const MAX_IMAGE_SIZE_MB = 15;

function trimValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalTrim(value: FormDataEntryValue | null) {
  const str = trimValue(value);
  return str.length > 0 ? str : null;
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[9px] uppercase tracking-[0.35em] text-gray-muted">
      {children}{required && <span className="text-gold"> *</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400/90">{message}</p>;
}

function FormInput({ id, name, type = "text", placeholder, required, error, dir, min, max }: { id: string; name: string; type?: string; placeholder?: string; required?: boolean; error?: string; dir?: "ltr" | "rtl"; min?: number; max?: number }) {
  return (
    <div>
      <input id={id} name={name} type={type} placeholder={placeholder} required={required} dir={dir} min={min} max={max} className={`w-full border bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-300 focus:border-gold/50 ${error ? "border-red-400/50" : "border-white/10"}`} />
      <FieldError message={error} />
    </div>
  );
}

function FormTextarea({ id, name, placeholder, error, dir, rows = 4 }: { id: string; name: string; placeholder?: string; error?: string; dir?: "ltr" | "rtl"; rows?: number }) {
  return (
    <div>
      <textarea id={id} name={name} placeholder={placeholder} dir={dir} rows={rows} className={`w-full resize-y border bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-300 focus:border-gold/50 ${error ? "border-red-400/50" : "border-white/10"}`} />
      <FieldError message={error} />
    </div>
  );
}

function SectionTitle({ title, isRtl }: { title: string; isRtl: boolean }) {
  return (
    <div className={`mb-8 flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
      <h2 className="text-[10px] uppercase tracking-[0.4em] text-gold">{title}</h2>
      <span className="gold-line flex-1" />
    </div>
  );
}

export function JoinTalentForm(props: { dict: Dictionary; locale: Locale }) {
  const [formKey, setFormKey] = useState(0);
  return <JoinTalentFormInner key={formKey} {...props} onReset={() => setFormKey(k => k + 1)} />;
}

function JoinTalentFormInner({ dict, locale, onReset }: { dict: Dictionary; locale: Locale; onReset: () => void }) {
  const j = dict.join;
  const isRtl = locale === "ar";
  const [clientError, setClientError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const displayFont = isRtl ? "var(--font-noto-arabic)" : "var(--font-cormorant)";
  const bodyFont = isRtl ? "var(--font-noto-arabic)" : "var(--font-dm-sans)";

  const submitTalentAction = rawSubmitTalentAction as (state: SubmitTalentState, formData: FormData) => Promise<SubmitTalentState>;
  const [state, formAction, isPending] = useActionState(submitTalentAction, initialSubmitTalentState);
  const errors = (state?.errors ?? {}) as TalentSubmissionErrors;

  async function handleFormAction(formData: FormData) {
    setClientError(null);
    setIsUploadingImages(true);
    try {
      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsUploadingImages(false);
    }
  }

  return (
    <form action={handleFormAction} noValidate className={isRtl ? "text-right" : "text-left"}>
      <input type="hidden" name="locale" value={locale} />
      {clientError && <p className="mb-8 border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-300" role="alert">{clientError}</p>}
      {state?.message && !state?.success && <p className="mb-8 border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-300" role="alert">{state.message}</p>}
      {Object.keys(errors ?? {}).length > 0 && <p className="mb-8 border border-gold/30 bg-gold/[0.04] px-4 py-3 text-sm text-gold" role="alert">{j.errorBanner}</p>}

      <SectionTitle title={j.sectionContact} isRtl={isRtl} />
      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="tiktok">TikTok</FieldLabel>
          <FormInput id="tiktok" name="tiktok" type="url" placeholder={j.placeholderTiktok} error={errors.tiktok} dir="ltr" />
        </div>
        <div>
          <FieldLabel htmlFor="snapchat">Snapchat</FieldLabel>
          <FormInput id="snapchat" name="snapchat" type="url" placeholder={j.placeholderSnapchat} error={errors.snapchat} dir="ltr" />
        </div>
        <div className="md:col-span-2">
          <FieldLabel htmlFor="portfolio_url">Portfolio URL</FieldLabel>
          <FormInput id="portfolio_url" name="portfolio_url" type="url" placeholder={j.placeholderPortfolio} error={errors.portfolio_url} dir="ltr" />
        </div>
      </div>

      <button type="submit" disabled={isPending || isUploadingImages} className="btn-luxury w-full border border-gold/40 bg-gold/[0.06] px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-50">{isUploadingImages ? (isRtl ? "جاري رفع الصور..." : "Uploading images...") : isPending ? j.submitting : j.submit}</button>
    </form>
  );
}