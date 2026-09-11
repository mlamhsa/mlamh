"use client";

import { useParams } from "next/navigation";
import { useRef, type ReactNode } from "react";

export default function TalentProfileDetailsLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ locale?: string }>();
  const isArabic = params?.locale !== "en";
  const editorScopeRef = useRef<HTMLDivElement>(null);

  function saveCurrentDraft() {
    // Scope the lookup to this route's editor only. This avoids submitting an
    // unrelated form if the surrounding dashboard shell adds another form later.
    const form = editorScopeRef.current?.querySelector<HTMLFormElement>("form");
    if (!form) return;

    // The profile editor contains approval hard-gate fields, but saving a draft
    // must remain possible before every hard gate is complete. Submission for
    // review is validated separately by the canonical readiness engine.
    const previousNoValidate = form.noValidate;
    form.noValidate = true;
    form.requestSubmit();
    window.setTimeout(() => {
      form.noValidate = previousNoValidate;
    }, 0);
  }

  return (
    <>
      <div ref={editorScopeRef}>{children}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-4 sm:px-6 lg:bottom-6">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button
            type="button"
            onClick={saveCurrentDraft}
            className="pointer-events-auto min-h-12 rounded-full border border-gold/35 bg-black/90 px-6 text-sm font-semibold text-gold shadow-2xl backdrop-blur-xl transition hover:bg-gold hover:text-black"
          >
            {isArabic ? "حفظ ما أدخلته" : "Save what you've entered"}
          </button>
        </div>
      </div>
    </>
  );
}
