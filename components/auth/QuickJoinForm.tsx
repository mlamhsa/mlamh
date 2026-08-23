"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

type QuickJoinFormProps = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
  action: (
    formData: FormData,
  ) => void | Promise<void>;
};

type CountryOption = {
  code: string;
  dialCode: string;
  nameAr: string;
  nameEn: string;
  example: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: "SA",
    dialCode: "+966",
    nameAr: "السعودية",
    nameEn: "Saudi Arabia",
    example: "5XXXXXXXX",
  },
  {
    code: "AE",
    dialCode: "+971",
    nameAr: "الإمارات",
    nameEn: "United Arab Emirates",
    example: "5XXXXXXXX",
  },
  {
    code: "KW",
    dialCode: "+965",
    nameAr: "الكويت",
    nameEn: "Kuwait",
    example: "XXXXXXXX",
  },
  {
    code: "QA",
    dialCode: "+974",
    nameAr: "قطر",
    nameEn: "Qatar",
    example: "XXXXXXXX",
  },
  {
    code: "BH",
    dialCode: "+973",
    nameAr: "البحرين",
    nameEn: "Bahrain",
    example: "XXXXXXXX",
  },
  {
    code: "OM",
    dialCode: "+968",
    nameAr: "عُمان",
    nameEn: "Oman",
    example: "XXXXXXXX",
  },
  {
    code: "EG",
    dialCode: "+20",
    nameAr: "مصر",
    nameEn: "Egypt",
    example: "1XXXXXXXXX",
  },
  {
    code: "JO",
    dialCode: "+962",
    nameAr: "الأردن",
    nameEn: "Jordan",
    example: "7XXXXXXXX",
  },
  {
    code: "MA",
    dialCode: "+212",
    nameAr: "المغرب",
    nameEn: "Morocco",
    example: "6XXXXXXXX",
  },
  {
    code: "DZ",
    dialCode: "+213",
    nameAr: "الجزائر",
    nameEn: "Algeria",
    example: "XXXXXXXXX",
  },
  {
    code: "TN",
    dialCode: "+216",
    nameAr: "تونس",
    nameEn: "Tunisia",
    example: "XXXXXXXX",
  },
  {
    code: "LB",
    dialCode: "+961",
    nameAr: "لبنان",
    nameEn: "Lebanon",
    example: "XXXXXXXX",
  },
  {
    code: "SY",
    dialCode: "+963",
    nameAr: "سوريا",
    nameEn: "Syria",
    example: "9XXXXXXXX",
  },
  {
    code: "IQ",
    dialCode: "+964",
    nameAr: "العراق",
    nameEn: "Iraq",
    example: "7XXXXXXXXX",
  },
  {
    code: "YE",
    dialCode: "+967",
    nameAr: "اليمن",
    nameEn: "Yemen",
    example: "XXXXXXXXX",
  },
  {
    code: "US",
    dialCode: "+1",
    nameAr: "الولايات المتحدة وكندا",
    nameEn: "United States & Canada",
    example: "XXXXXXXXXX",
  },
  {
    code: "GB",
    dialCode: "+44",
    nameAr: "المملكة المتحدة",
    nameEn: "United Kingdom",
    example: "7XXXXXXXXX",
  },
];

function SubmitButton({
  isRtl,
}: {
  isRtl: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
          />

          <span>
            {isRtl
              ? "جارٍ إنشاء الحساب..."
              : "Creating account..."}
          </span>
        </>
      ) : (
        <span>
          {isRtl
            ? "إنشاء الحساب"
            : "Create account"}
        </span>
      )}
    </button>
  );
}

function PasswordVisibilityIcon({
  visible,
}: {
  visible: boolean;
}) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9 5 9 5a16.4 16.4 0 0 1-2.3 2.8M6.1 6.1C4.1 7.5 3 9 3 9s3.5 5 9 5c1 0 1.9-.2 2.7-.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.4"
      />
    </svg>
  );
}

function normalizeLocalPhone(
  value: string,
) {
  return value
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "")
    .slice(0, 15);
}

export function QuickJoinForm({
  locale,
  accountType,
  action,
}: QuickJoinFormProps) {
  const isRtl = locale === "ar";

  const draftStorageKey =
    `mlamh-join-draft:${locale}`;

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [countryCode, setCountryCode] =
    useState("SA");

  const [phone, setPhone] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showPasswordConfirmation,
    setShowPasswordConfirmation,
  ] = useState(false);

  const selectedCountry =
    useMemo(
      () =>
        COUNTRY_OPTIONS.find(
          (country) =>
            country.code === countryCode,
        ) ?? COUNTRY_OPTIONS[0],
      [countryCode],
    );

  const normalizedPhone = phone
    ? `${selectedCountry.dialCode}${phone}`
    : "";

  useEffect(() => {
    try {
      const savedDraft =
        window.sessionStorage.getItem(
          draftStorageKey,
        );

      if (!savedDraft) {
        return;
      }

      const parsedDraft =
        JSON.parse(savedDraft) as {
          fullName?: string;
          email?: string;
          countryCode?: string;
          phone?: string;
        };

      setFullName(
        parsedDraft.fullName ?? "",
      );

      setEmail(
        parsedDraft.email ?? "",
      );

      setCountryCode(
        COUNTRY_OPTIONS.some(
          (country) =>
            country.code ===
            parsedDraft.countryCode,
        )
          ? String(
              parsedDraft.countryCode,
            )
          : "SA",
      );

      setPhone(
        parsedDraft.phone ?? "",
      );
    } catch {
      // فشل التخزين المؤقت لا يمنع التسجيل.
    }
  }, [draftStorageKey]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          fullName,
          email,
          countryCode,
          phone,
        }),
      );
    } catch {
      // فشل التخزين المؤقت لا يمنع التسجيل.
    }
  }, [
    draftStorageKey,
    fullName,
    email,
    countryCode,
    phone,
  ]);

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="locale"
        value={locale}
      />

      <input
        type="hidden"
        name="countryCode"
        value={selectedCountry.dialCode}
      />

      <input
        type="hidden"
        name="countryIso"
        value={selectedCountry.code}
      />

      <input
        type="hidden"
        name="phone"
        value={normalizedPhone}
      />

      <div>
        <label
          htmlFor="join-full-name"
          className="mb-2 block text-sm text-white/65"
        >
          {accountType === "publisher"
  ? isRtl
    ? "اسم المسؤول"
    : "Contact person name"
  : isRtl
    ? "الاسم الكامل"
    : "Full name"}
        </label>

        <input
          id="join-full-name"
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={fullName}
          onChange={(event) =>
            setFullName(
              event.currentTarget.value,
            )
          }
          placeholder={
            accountType === "publisher"
              ? isRtl
                ? "اكتب اسم الشخص المسؤول عن الحساب"
                : "Enter the account contact person's name"
              : isRtl
                ? "اكتب اسمك الكامل"
                : "Enter your full name"
          }
          className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="join-email"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl
            ? "البريد الإلكتروني"
            : "Email address"}
        </label>

        <input
          id="join-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(event) =>
            setEmail(
              event.currentTarget.value,
            )
          }
          placeholder="name@example.com"
          className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="join-phone"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl
            ? "رقم الجوال"
            : "Mobile number"}
        </label>

        <div className="grid grid-cols-[8.75rem_minmax(0,1fr)] gap-2">
          <label
            htmlFor="join-country"
            className="sr-only"
          >
            {isRtl
              ? "الدولة ومفتاح الاتصال"
              : "Country and calling code"}
          </label>

          <select
            id="join-country"
            value={countryCode}
            onChange={(event) => {
              setCountryCode(
                event.currentTarget.value,
              );

              setPhone("");
            }}
            className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-gold/50"
          >
            {COUNTRY_OPTIONS.map(
              (country) => (
                <option
                  key={country.code}
                  value={country.code}
                  className="bg-black text-white"
                >
                  {country.dialCode}{" "}
                  {isRtl
                    ? country.nameAr
                    : country.nameEn}
                </option>
              ),
            )}
          </select>

          <input
            id="join-phone"
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) =>
              setPhone(
                normalizeLocalPhone(
                  event.currentTarget.value,
                ),
              )
            }
            minLength={7}
            maxLength={15}
            pattern="[0-9]{7,15}"
            placeholder={
              selectedCountry.example
            }
            dir="ltr"
            className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"
          />
        </div>

        <p className="mt-2 text-[11px] leading-5 text-white/30">
          {isRtl
            ? `سيُحفظ الرقم بصيغة دولية: ${
                normalizedPhone ||
                `${selectedCountry.dialCode}${selectedCountry.example}`
              }`
            : `The number will be saved internationally: ${
                normalizedPhone ||
                `${selectedCountry.dialCode}${selectedCountry.example}`
              }`}
        </p>
      </div>

      <div>
        <label
          htmlFor="join-password"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl
            ? "كلمة المرور"
            : "Password"}
        </label>

        <div className="relative">
          <input
            id="join-password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={
              isRtl
                ? "٨ أحرف على الأقل"
                : "At least 8 characters"
            }
            className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm ${
              isRtl
                ? "pr-4 pl-14"
                : "pl-4 pr-14"
            }`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) => !current,
              )
            }
            aria-label={
              showPassword
                ? isRtl
                  ? "إخفاء كلمة المرور"
                  : "Hide password"
                : isRtl
                  ? "إظهار كلمة المرور"
                  : "Show password"
            }
            aria-pressed={showPassword}
            className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${
              isRtl
                ? "left-2"
                : "right-2"
            }`}
          >
            <PasswordVisibilityIcon
              visible={showPassword}
            />
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="join-password-confirmation"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl
            ? "تأكيد كلمة المرور"
            : "Confirm password"}
        </label>

        <div className="relative">
          <input
            id="join-password-confirmation"
            name="passwordConfirmation"
            type={
              showPasswordConfirmation
                ? "text"
                : "password"
            }
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={
              isRtl
                ? "أعد كتابة كلمة المرور"
                : "Enter your password again"
            }
            className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm ${
              isRtl
                ? "pr-4 pl-14"
                : "pl-4 pr-14"
            }`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPasswordConfirmation(
                (current) => !current,
              )
            }
            aria-label={
              showPasswordConfirmation
                ? isRtl
                  ? "إخفاء تأكيد كلمة المرور"
                  : "Hide password confirmation"
                : isRtl
                  ? "إظهار تأكيد كلمة المرور"
                  : "Show password confirmation"
            }
            aria-pressed={
              showPasswordConfirmation
            }
            className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${
              isRtl
                ? "left-2"
                : "right-2"
            }`}
          >
            <PasswordVisibilityIcon
              visible={
                showPasswordConfirmation
              }
            />
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input
          name="acceptTerms"
          type="checkbox"
          value="accepted"
          required
          className="mt-1 h-5 w-5 shrink-0 accent-[#c8a96a]"
        />

        <span className="text-xs leading-6 text-white/50">
          {isRtl
            ? "أوافق على "
            : "I agree to the "}

          <Link
            href={`/${locale}/terms`}
            target="_blank"
            rel="noreferrer"
            className="text-gold transition hover:text-gold-soft"
          >
            {isRtl
              ? "الشروط والأحكام"
              : "Terms and Conditions"}
          </Link>

          {isRtl ? " و" : " and "}

          <Link
            href={`/${locale}/privacy`}
            target="_blank"
            rel="noreferrer"
            className="text-gold transition hover:text-gold-soft"
          >
            {isRtl
              ? "سياسة الخصوصية"
              : "Privacy Policy"}
          </Link>
        </span>
      </label>

      <SubmitButton isRtl={isRtl} />

      <p className="text-center text-[11px] leading-5 text-white/30">
        {isRtl
          ? "سيتم توثيق البريد الإلكتروني الآن، أما توثيق رقم الجوال فسيُفعّل لاحقًا."
          : "Email verification is required now. Mobile OTP verification will be enabled later."}
      </p>
    </form>
  );
}