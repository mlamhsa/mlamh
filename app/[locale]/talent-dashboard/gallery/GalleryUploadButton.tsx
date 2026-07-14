"use client";

import { useFormStatus } from "react-dom";

function UploadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 16V5M8 9l4-4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14.5v3A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoadingIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GalleryUploadButton({
  isArabic,
}: {
  isArabic: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold px-6 text-sm text-black transition ${
        pending
          ? "cursor-wait opacity-70"
          : "hover:bg-gold-soft active:scale-[0.99]"
      }`}
    >
      {pending ? (
        <>
          <LoadingIcon />
          {isArabic ? "جارٍ رفع الصورة..." : "Uploading image..."}
        </>
      ) : (
        <>
          <UploadIcon />
          {isArabic ? "رفع الصورة" : "Upload Image"}
        </>
      )}
    </button>
  );
}