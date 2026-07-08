"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isRtl = locale === "ar";
  const router = useRouter();

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [openEdit, setOpenEdit] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      if (!data.user) {
        router.replace(`/${locale}/login`);
        return;
      }

      setUser(data.user);
      setLoadingUser(false);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        if (!session?.user) {
          router.replace(`/${locale}/login`);
          return;
        }

        setUser(session.user);
        setLoadingUser(false);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [locale, router]);

  const saveAccountChanges = async () => {
    const email = newEmail.trim();
    const password = newPassword.trim();

    if (!email && !password) {
      setOpenEdit(false);
      return;
    }

    setSaving(true);

    try {
      if (email) {
        const { error } = await supabase.auth.updateUser({ email });

        if (error) {
          alert(error.message);
          return;
        }
      }

      if (password) {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          alert(error.message);
          return;
        }
      }

      alert(
        isRtl
          ? email
            ? "تم حفظ التغييرات. قد تحتاج لتأكيد البريد الجديد."
            : "تم تحديث كلمة المرور."
          : email
          ? "Changes saved. You may need to confirm the new email."
          : "Password updated."
      );

      setNewEmail("");
      setNewPassword("");
      setOpenEdit(false);
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-white/50">
          {isRtl ? "جاري التحقق من الحساب..." : "Checking account..."}
        </p>
      </main>
    );
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black px-6 py-10 text-white"
    >
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-light">
            {isRtl ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-sm text-white/50">
            {isRtl ? "إدارة حسابك وإعداداتك" : "Manage your account settings"}
          </p>
        </div>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xs uppercase tracking-[0.3em] text-white/40">
            {isRtl ? "الحساب" : "Account"}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-white/60">
                {isRtl ? "البريد الإلكتروني" : "Email"}
              </span>
              <span className="break-all text-white">{user?.email}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-white/60">User ID</span>
              <span className="text-xs text-white/40">
                {user?.id ? `${user.id.slice(0, 8)}...` : "-"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setOpenEdit(true)}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "تعديل الحساب" : "Edit Account"}
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xs uppercase tracking-[0.3em] text-white/40">
            {isRtl ? "الإشعارات" : "Notifications"}
          </h2>

          <label className="flex justify-between gap-4">
            <span>{isRtl ? "إشعارات البريد" : "Email Notifications"}</span>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
              className="accent-gold"
            />
          </label>

          <label className="flex justify-between gap-4">
            <span>{isRtl ? "إشعارات الرسائل" : "SMS Notifications"}</span>
            <input
              type="checkbox"
              checked={smsNotif}
              onChange={(e) => setSmsNotif(e.target.checked)}
              className="accent-gold"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-xs uppercase tracking-[0.3em] text-red-300">
            {isRtl ? "إدارة الحساب الحساسة" : "Sensitive Account Actions"}
          </h2>

          <p className="mt-3 text-sm text-white/40">
            {isRtl
              ? "هذه الإجراءات قد تؤثر على حسابك بشكل دائم، يرجى التأكد قبل المتابعة."
              : "These actions may permanently affect your account. Please proceed carefully."}
          </p>

          <button
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-300/50"
          >
            {isRtl ? "حذف الحساب غير متاح حالياً" : "Account deletion unavailable"}
          </button>
        </section>
      </div>

      {openEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-black p-6">
            <h2 className="text-lg">
              {isRtl ? "تعديل الحساب" : "Edit Account"}
            </h2>

            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-gold/40"
              placeholder={isRtl ? "البريد الإلكتروني الجديد" : "New email"}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-gold/40"
              placeholder={isRtl ? "كلمة المرور الجديدة" : "New password"}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpenEdit(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 p-3 text-white/70 disabled:opacity-50"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>

              <button
                onClick={saveAccountChanges}
                disabled={saving}
                className="flex-1 rounded-xl bg-gold p-3 text-black disabled:opacity-60"
              >
                {saving
                  ? isRtl
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isRtl
                  ? "حفظ"
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}