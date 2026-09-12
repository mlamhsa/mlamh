"use client";

import { useEffect } from "react";

function isArabicPage() {
  return document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
}

export function TalentImageUploadPendingEnhancer() {
  useEffect(() => {
    const cleanups = new Map<HTMLFormElement, () => void>();

    const enhance = () => {
      document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
        if (cleanups.has(form)) return;
        const fileInput = form.querySelector<HTMLInputElement>('input[type="file"][name="profile_image"]');
        if (!fileInput) return;

        const onSubmit = () => {
          const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (!submit || submit.dataset.mlamhUploading === "1") return;

          submit.dataset.mlamhUploading = "1";
          submit.disabled = true;
          submit.setAttribute("aria-busy", "true");
          submit.classList.add("cursor-wait", "opacity-75");

          const original = submit.textContent ?? "";
          submit.dataset.mlamhOriginalLabel = original;
          submit.innerHTML = `
            <span class="inline-flex items-center justify-center gap-2">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" aria-hidden="true"></span>
              <span>${isArabicPage() ? "جارٍ رفع الصورة..." : "Uploading photo..."}</span>
            </span>
          `;

          let status = form.querySelector<HTMLElement>('[data-mlamh-upload-status="1"]');
          if (!status) {
            status = document.createElement("p");
            status.dataset.mlamhUploadStatus = "1";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            status.className = "text-center text-xs text-gold/80 sm:text-start";
            status.textContent = isArabicPage()
              ? "يتم رفع الصورة وحفظها، لا تغلق الصفحة."
              : "Your photo is being uploaded and saved. Please keep this page open.";
            form.appendChild(status);
          }
        };

        form.addEventListener("submit", onSubmit);
        cleanups.set(form, () => form.removeEventListener("submit", onSubmit));
      });
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  return null;
}
