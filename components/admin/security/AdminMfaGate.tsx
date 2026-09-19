"use client";

import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "challenge" | "verifying" | "error";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function AdminMfaGate() {
  const supabase = createBrowserSupabaseClient();
  const startedRef = useRef(false);
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) throw assurance.error;

        if (assurance.data.currentLevel === "aal2") {
          const currentUser =
            await supabase.auth.getUser();
          if (currentUser.error) {
            throw currentUser.error;
          }

          if (
            currentUser.data.user
              ?.app_metadata
              ?.admin_invite_status ===
            "pending"
          ) {
            const activationResponse =
              await fetch(
                "/api/admin/security/mfa-event",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    mode:
                      "activation",
                    outcome:
                      "success",
                  }),
                  cache:
                    "no-store",
                },
              );

            if (!activationResponse.ok) {
              throw new Error(
                "تعذر إكمال تفعيل حساب الإدارة بعد التحقق بخطوتين.",
              );
            }
          }

          window.location.replace("/admin");
          return;
        }

        const factors = await supabase.auth.mfa.listFactors();
        if (factors.error) throw factors.error;

        const verifiedTotp = factors.data.totp.find(
          (factor) => factor.status === "verified",
        );

        if (verifiedTotp) {
          setFactorId(verifiedTotp.id);
          setMode("challenge");
          return;
        }

        // A page reload can leave a previous TOTP enrollment in the
        // unverified state. Supabase will reject a new enrollment with the
        // same friendly name, so clear incomplete factors before creating a
        // fresh QR/secret that the user can actually finish verifying.
        const unverifiedTotp = factors.data.all.filter(
          (factor) =>
            factor.factor_type === "totp" &&
            factor.status === "unverified",
        );

        for (const factor of unverifiedTotp) {
          const cleanup = await supabase.auth.mfa.unenroll({
            factorId: factor.id,
          });
          if (cleanup.error) throw cleanup.error;
        }

        const enroll = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "MLAMH Admin",
        });
        if (enroll.error) throw enroll.error;

        setFactorId(enroll.data.id);
        setEnrollment({
          factorId: enroll.data.id,
          qrCode: enroll.data.totp.qr_code,
          secret: enroll.data.totp.secret,
        });
        setMode("enroll");
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "تعذر تهيئة التحقق بخطوتين.";
        setError(message);
        setFactorId("");
        setEnrollment(null);
        setMode("error");
      }
    })();
  }, [supabase]);

  async function verify() {
    const normalizedCode = code.replace(/\s+/g, "");
    let mfaVerified = false;
    if (!/^\d{6,10}$/.test(normalizedCode) || !factorId) {
      setError("أدخل رمز التحقق الصحيح من تطبيق المصادقة.");
      return;
    }

    setError("");
    setMode("verifying");

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const result = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: normalizedCode,
      });
      if (result.error) throw result.error;

      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (assurance.data.currentLevel !== "aal2") {
        throw new Error("لم يتم رفع مستوى الجلسة إلى AAL2.");
      }

      mfaVerified = true;

      try {
        const auditResponse =
          await fetch(
            "/api/admin/security/mfa-event",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                mode: enrollment
                  ? "enrollment"
                  : "challenge",
                outcome:
                  "success",
              }),
              cache: "no-store",
              keepalive: true,
            },
          );

        if (!auditResponse.ok) {
          throw new Error(
            "تعذر إكمال تسجيل التحقق الآمن لحساب الإدارة.",
          );
        }
      } catch (auditError) {
        console.warn(
          "[AdminMfaGate audit]",
          auditError,
        );
        throw auditError;
      }

      window.location.replace("/admin");
    } catch (caught) {
      if (!mfaVerified) {
        try {
          await fetch(
            "/api/admin/security/mfa-event",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                mode: enrollment
                  ? "enrollment"
                  : "challenge",
                outcome:
                  "failed",
              }),
              cache: "no-store",
              keepalive: true,
            },
          );
        } catch (auditError) {
          console.warn(
            "[AdminMfaGate failed audit]",
            auditError,
          );
        }
      }

      const message =
        caught instanceof Error
          ? caught.message
          : "رمز التحقق غير صالح.";
      setError(message);
      setMode(
        mfaVerified
          ? "error"
          : enrollment
            ? "enroll"
            : "challenge",
      );
    }
  }

  if (mode === "loading") {
    return <p className="text-sm text-white/60">جارٍ تجهيز التحقق الآمن…</p>;
  }

  if (mode === "error") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-200">
          {error || "تعذر تهيئة التحقق بخطوتين."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {enrollment ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">فعّل المصادقة الثنائية</h2>
            <p className="mt-1 text-sm leading-6 text-white/60">
              امسح رمز QR باستخدام Google Authenticator أو 1Password أو أي تطبيق TOTP موثوق، ثم أدخل الرمز الظاهر في التطبيق.
            </p>
          </div>

          <div className="flex justify-center rounded-2xl bg-white p-4">
            {/* Supabase returns this QR code from its authenticated MFA enrollment API. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollment.qrCode} alt="MLAMH Admin MFA QR code" className="h-52 w-52" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-white/50">المفتاح اليدوي عند تعذر مسح QR</p>
            <code className="mt-2 block break-all text-sm text-white">{enrollment.secret}</code>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-sm leading-6 text-amber-100/80">
            هذا الرمز والمفتاح خاصان بحساب إدارة ملامح. لا تشارك QR أو المفتاح اليدوي أو رمز التحقق مع أي شخص.
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-white">تحقق من هويتك</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">
            أدخل الرمز الحالي من تطبيق المصادقة لإكمال الدخول إلى لوحة الإدارة.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="admin-mfa-code" className="block text-sm font-medium text-white/80">
          رمز التحقق
        </label>
        <input
          id="admin-mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
          onKeyDown={(event) => {
            if (event.key === "Enter") void verify();
          }}
          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-xl tracking-[0.35em] text-white outline-none focus:border-white/30"
          placeholder="000000"
          disabled={mode === "verifying"}
        />

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void verify()}
          disabled={mode === "verifying" || !code}
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "verifying" ? "جارٍ التحقق…" : enrollment ? "تفعيل والدخول" : "تحقق وادخل"}
        </button>
      </div>
    </div>
  );
}
