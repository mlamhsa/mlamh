"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  MessageSquare,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = use(params);
  const isRtl = locale === "ar";
  const router = useRouter();

  const [emailNotif, setEmailNotif] = useState(true);
const [smsNotif, setSmsNotif] = useState(false);
const [loadingPreferences, setLoadingPreferences] = useState(true);
const [savingPreference, setSavingPreference] = useState<
  "email" | "sms" | null
>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [openEdit, setOpenEdit] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
    
      if (!active) return;
    
      if (error || !data.user) {
        router.replace(`/${locale}/login`);
        return;
      }
    
      setUser(data.user);
    
      const {
        data: preferences,
        error: preferencesError,
      } = await supabase
        .from("notification_preferences")
        .select("email_enabled, sms_enabled")
        .eq("user_id", data.user.id)
        .maybeSingle();
    
      if (!active) return;
    
      if (preferencesError) {
        console.error(
          "Notification preferences load error:",
          preferencesError,
        );
      }
    
      if (preferences) {
        setEmailNotif(preferences.email_enabled);
        setSmsNotif(preferences.sms_enabled);
      }
    
      setLoadingPreferences(false);
      setLoadingUser(false);
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [locale, router]);

  useEffect(() => {
    if (!openEdit) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        setOpenEdit(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openEdit, saving]);

  function closeEditModal() {
    if (saving) {
      return;
    }
  
    setOpenEdit(false);
    setNewEmail("");
    setNewPassword("");
    setFeedback(null);
  }
  async function saveNotificationPreference(
    type: "email" | "sms",
    value: boolean,
  ) {
    if (!user || savingPreference) {
      return;
    }
  
    setSavingPreference(type);
  
    const column =
      type === "email"
        ? "email_enabled"
        : "sms_enabled";
  
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          [column]: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );
  
    if (error) {
      console.error(
        "Notification preference save error:",
        error,
      );
  
      setSavingPreference(null);
      return;
    }
  
    if (type === "email") {
      setEmailNotif(value);
    } else {
      setSmsNotif(value);
    }
  
    setSavingPreference(null);
  }
  async function saveAccountChanges() {
    const email = newEmail.trim();
    const password = newPassword.trim();

    setFeedback(null);

    if (!email && !password) {
      setFeedback({
        type: "error",
        message: isRtl
          ? "أدخل بريدًا جديدًا أو كلمة مرور جديدة."
          : "Enter a new email or password.",
      });
      return;
    }

    if (password && password.length < 6) {
      setFeedback({
        type: "error",
        message: isRtl
          ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
          : "Password must be at least 6 characters.",
      });
      return;
    }

    setSaving(true);

    try {
      const payload: {
        email?: string;
        password?: string;
      } = {};

      if (email) payload.email = email;
      if (password) payload.password = password;

      const { data, error } = await supabase.auth.updateUser(payload);

      if (error) {
        setFeedback({
          type: "error",
          message: error.message,
        });
        return;
      }

      if (data.user) {
        setUser(data.user);
      }

      setFeedback({
        type: "success",
        message: email
          ? isRtl
            ? "تم حفظ التغييرات. قد تحتاج إلى تأكيد البريد الإلكتروني الجديد."
            : "Changes saved. You may need to confirm the new email."
          : isRtl
            ? "تم تحديث كلمة المرور بنجاح."
            : "Password updated successfully.",
      });

      setNewEmail("");
      setNewPassword("");

      window.setTimeout(() => {
        closeEditModal();
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  const lastSignInAt = user?.last_sign_in_at
    ? new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(user.last_sign_in_at))
    : isRtl
      ? "غير متوفر"
      : "Unavailable";

  const signInProvider =
    user?.app_metadata?.provider === "email"
      ? isRtl
        ? "البريد الإلكتروني"
        : "Email"
      : user?.app_metadata?.provider || (isRtl ? "غير محدد" : "Not specified");

  const emailConfirmed = Boolean(user?.email_confirmed_at);

  if (loadingUser) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-5 text-white"
      >
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
          {isRtl ? "جارٍ التحقق من الحساب..." : "Checking account..."}
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-7 lg:p-8">
          <div
            className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/${locale}/talent-dashboard`}
                className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
              >
                <ArrowLeft
                  className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`}
                />
                {isRtl ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
              </Link>

              <p className="mt-6 text-[10px] uppercase tracking-[0.36em] text-gold">
                {isRtl ? "لوحة الموهبة" : "Talent Workspace"}
              </p>

              <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
                {isRtl ? "الإعدادات" : "Settings"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                {isRtl
                  ? "أدر بيانات حسابك وتفضيلات الإشعارات وإعدادات الأمان من مكان واحد."
                  : "Manage your account details, notification preferences, and security settings in one place."}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
              <Settings className="h-6 w-6" />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "الحساب" : "Account"}
                </p>
                <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                  {isRtl ? "بيانات تسجيل الدخول" : "Login Details"}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <UserRound className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <AccountRow
                icon={<Mail className="h-4 w-4" />}
                label={isRtl ? "البريد الإلكتروني" : "Email"}
                value={user?.email || "—"}
              />

              <AccountRow
                icon={<KeyRound className="h-4 w-4" />}
                label={isRtl ? "معرّف المستخدم" : "User ID"}
                value={user?.id ? `${user.id.slice(0, 8)}…` : "—"}
              />

              <AccountRow
                icon={<LockKeyhole className="h-4 w-4" />}
                label={isRtl ? "حالة الحساب" : "Account Status"}
                value={isRtl ? "نشط" : "Active"}
                success
              />
            </div>

            <button
              type="button"
              onClick={() => setOpenEdit(true)}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gold/35 bg-gold/[0.06] px-5 text-sm text-gold transition hover:bg-gold/10"
            >
              <KeyRound className="h-4 w-4" />
              {isRtl ? "تحديث البريد وكلمة المرور" : "Update Email & Password"}
            </button>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "الإشعارات" : "Notifications"}
                </p>
                <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                  {isRtl ? "تفضيلات التنبيهات" : "Alert Preferences"}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <Bell className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/45">
              {isRtl
                ? "اختر الطرق التي تفضل استقبال تحديثات الطلبات والتنبيهات من خلالها."
                : "Choose how you prefer to receive application updates and account alerts."}
            </p>

            <div className="mt-6 space-y-3">
              <PreferenceToggle
                title={isRtl ? "إشعارات البريد" : "Email Notifications"}
                description={
                  isRtl
                    ? "استقبال تحديثات الطلبات والتنبيهات عبر البريد الإلكتروني."
                    : "Receive application updates and alerts by email."
                }
                checked={emailNotif}
                onChange={(value) =>
                  saveNotificationPreference("email", value)
                }
                icon={<Mail className="h-5 w-5" />}
                isRtl={isRtl}
              />

              <PreferenceToggle
                title={isRtl ? "إشعارات الرسائل" : "SMS Notifications"}
                description={
                  isRtl
                    ? "استقبال التنبيهات المهمة عبر الرسائل النصية عند تفعيل الخدمة."
                    : "Receive important alerts by SMS when the service is enabled."
                }
                checked={smsNotif}
onChange={(value) =>
  saveNotificationPreference("sms", value)
}
                icon={<MessageSquare className="h-5 w-5" />}
                isRtl={isRtl}
              />
            </div>

          </article>
        </section>


        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "الأمان" : "Security"}
              </p>

              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isRtl ? "حالة أمان الحساب" : "Account Security Status"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isRtl
                  ? "راجع معلومات تسجيل الدخول وتأكيد البريد وإعدادات الحماية المرتبطة بحسابك."
                  : "Review your sign-in information, email verification, and account protection settings."}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SecurityCard
              icon={<Clock3 className="h-5 w-5" />}
              label={isRtl ? "آخر تسجيل دخول" : "Last Sign In"}
              value={lastSignInAt}
            />

            <SecurityCard
              icon={<LogIn className="h-5 w-5" />}
              label={isRtl ? "طريقة تسجيل الدخول" : "Sign-in Method"}
              value={signInProvider}
            />

            <SecurityCard
              icon={<Mail className="h-5 w-5" />}
              label={isRtl ? "البريد مؤكد" : "Email Verified"}
              value={
                emailConfirmed
                  ? isRtl
                    ? "نعم"
                    : "Yes"
                  : isRtl
                    ? "لا"
                    : "No"
              }
              success={emailConfirmed}
            />

            <SecurityCard
              icon={<Smartphone className="h-5 w-5" />}
              label={isRtl ? "المصادقة الثنائية" : "Two-Factor Authentication"}
              value={isRtl ? "غير مفعلة" : "Not Enabled"}
            />
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-red-400/20 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.08),transparent_42%),rgba(248,113,113,0.025)] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/[0.06] text-red-200">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-red-300">
                  {isRtl ? "منطقة حساسة" : "Sensitive Area"}
                </p>
                <h2 className="mt-2 text-2xl font-light">
                  {isRtl ? "إدارة الحساب الحساسة" : "Sensitive Account Actions"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                  {isRtl
                    ? "حذف الحساب غير متاح في هذه المرحلة لحماية البيانات والطلبات المرتبطة بحسابك."
                    : "Account deletion is unavailable at this stage to protect data and applications linked to your account."}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="min-h-11 w-fit cursor-not-allowed rounded-2xl border border-red-300/20 bg-red-300/[0.05] px-5 text-sm text-red-200/45"
            >
              {isRtl ? "غير متاح حاليًا" : "Currently Unavailable"}
            </button>
          </div>
        </section>
      </div>

      {openEdit ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-account-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeEditModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#090909] p-5 shadow-2xl shadow-black/60 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "أمان الحساب" : "Account Security"}
                </p>
                <h2
                  id="edit-account-title"
                  className="mt-2 text-2xl font-light"
                >
                  {isRtl ? "تعديل بيانات الحساب" : "Edit Account Details"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/45 transition hover:border-gold/30 hover:text-gold disabled:opacity-40"
                aria-label={isRtl ? "إغلاق" : "Close"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-7 text-white/40">
              {isRtl
                ? "يمكنك تحديث البريد الإلكتروني أو كلمة المرور أو كليهما."
                : "You can update your email, password, or both."}
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {isRtl ? "البريد الإلكتروني الجديد" : "New Email"}
                </span>
                <div className="relative">
                  <Mail
                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 ${
                      isRtl ? "right-4" : "left-4"
                    }`}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    className={`w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 text-white outline-none transition placeholder:text-white/20 focus:border-gold/40 ${
                      isRtl ? "pr-11 pl-4" : "pl-11 pr-4"
                    }`}
                    placeholder={user?.email || ""}
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                </span>
                <div className="relative">
                  <LockKeyhole
                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 ${
                      isRtl ? "right-4" : "left-4"
                    }`}
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={`w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 text-white outline-none transition placeholder:text-white/20 focus:border-gold/40 ${
                      isRtl ? "pr-11 pl-4" : "pl-11 pr-4"
                    }`}
                    placeholder={
                      isRtl ? "6 أحرف على الأقل" : "At least 6 characters"
                    }
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
              </label>
            </div>

            {feedback ? (
              <div
                className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200"
                    : "border-red-300/20 bg-red-300/[0.06] text-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="min-h-12 rounded-2xl border border-white/10 text-sm text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={saveAccountChanges}
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-sm text-black transition hover:bg-gold-soft disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                    {isRtl ? "جارٍ الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {isRtl ? "حفظ التغييرات" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function AccountRow({
  icon,
  label,
  value,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-white/45">
        <span className="text-gold">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>

      <span
        className={`break-all text-sm ${
          success ? "text-emerald-200" : "text-white/75"
        }`}
      >
        {value}
      </span>
    </div>
  );
}


function SecurityCard({
  icon,
  label,
  value,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-gold/20">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
        {icon}
      </div>

      <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm leading-6 ${
          success ? "text-emerald-200" : "text-white/70"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
  icon,
  isRtl,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
  isRtl: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-white/80">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/35">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300 ${
          checked
            ? "border-gold/40 bg-gold"
            : "border-white/15 bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-300 ${
            checked
              ? isRtl
                ? "left-1"
                : "right-1"
              : isRtl
                ? "right-1"
                : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
