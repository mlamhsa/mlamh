"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0b0d",
          color: "#f7f4ee",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 520, padding: 32, textAlign: "center" }}>
          <h1 style={{ marginBottom: 12, fontSize: 28 }}>حدث خطأ غير متوقع</h1>
          <p style={{ marginBottom: 24, opacity: 0.72, lineHeight: 1.8 }}>
            تم تسجيل الخطأ تقنيًا. يمكنك إعادة المحاولة دون فقدان حسابك.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 999,
              padding: "12px 22px",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
