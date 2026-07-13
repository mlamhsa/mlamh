"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAutoSave } from "@/hooks/useAutoSave";

import {
  getOwnTalentProfileAction,
  updateOwnTalentProfileAction,
} from "@/lib/actions/update-own-talent-profile";

import IdentityCard from "@/components/talent/profile/IdentityCard";
import AboutCard from "@/components/talent/profile/AboutCard";
import MeasurementsCard from "@/components/talent/profile/MeasurementsCard";
import ExperienceCard from "@/components/talent/profile/ExperienceCard";
import ProfileCompletionCard from "@/components/talent/profile/ProfileCompletionCard";

import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

import {
  TextField,
  SelectField,
  ComboBoxField,
  TextAreaField,
} from "@/components/forms/FormField";

type TalentProfileFormData = {
  name_en: string;

  category_slug: string;
  city_slug: string;

  nationality: string;
  nationality_slug: string;

  gender: string;
  date_of_birth: string;

  languages: string[];
  dialects: string[];
  skills: string[];

  bio_en: string;
  bio_ar: string;

  instagram: string;
  tiktok: string;
  snapchat: string;
  portfolio_url: string;

  availability_status: string;

  height_cm: string;
  weight_kg: string;

  eye_color: string;
  hair_color: string;
  hair_type: string;
  skin_color: string;

  clothing_size: string;
  shoe_size: string;
  chest_size: string;
  waist_size: string;
  hip_size: string;

  experience_years: string;
  video_intro: string;
  showreel_url: string;

  ready_to_travel: boolean;
  has_passport: boolean;
  has_car: boolean;
  work_outside_city: boolean;
  work_outside_country: boolean;

  image_url: string;
  gallery_images: string[];
};

type SelectOption = {
  value: string;
  label: string;
};

type LocalizedOption = {
  value: string;
  ar: string;
  en: string;
};

function localizeOptions(
  options: LocalizedOption[],
  isArabic: boolean
): SelectOption[] {
  return options.map((option) => ({
    value: option.value,
    label: isArabic ? option.ar : option.en,
  }));
}

const LANGUAGE_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "arabic", ar: "العربية", en: "Arabic" },
  { value: "english", ar: "الإنجليزية", en: "English" },
  { value: "french", ar: "الفرنسية", en: "French" },
  { value: "urdu", ar: "الأوردية", en: "Urdu" },
  { value: "turkish", ar: "التركية", en: "Turkish" },
];

const DIALECT_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "najdi", ar: "نجدي", en: "Najdi" },
  { value: "hejazi", ar: "حجازي", en: "Hejazi" },
  { value: "southern", ar: "جنوبي", en: "Southern" },
  { value: "northern", ar: "شمالي", en: "Northern" },
  { value: "gulf", ar: "خليجي", en: "Gulf" },
  { value: "egyptian", ar: "مصري", en: "Egyptian" },
  { value: "levantine", ar: "شامي", en: "Levantine" },
];

const SKILL_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "acting", ar: "تمثيل", en: "Acting" },
  { value: "modeling", ar: "عرض أزياء", en: "Modeling" },
  { value: "voice_over", ar: "تعليق صوتي", en: "Voice Over" },
  { value: "presenting", ar: "تقديم", en: "Presenting" },
  { value: "singing", ar: "غناء", en: "Singing" },
  { value: "dancing", ar: "رقص", en: "Dancing" },
  { value: "sports", ar: "رياضة", en: "Sports" },
];

const GENDER_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "male", ar: "ذكر", en: "Male" },
  { value: "female", ar: "أنثى", en: "Female" },
];

const AVAILABILITY_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "available_now", ar: "متاح الآن", en: "Available Now" },
  {
    value: "available_this_week",
    ar: "متاح هذا الأسبوع",
    en: "Available This Week",
  },
  {
    value: "available_next_month",
    ar: "متاح الشهر القادم",
    en: "Available Next Month",
  },
  { value: "unavailable", ar: "غير متاح", en: "Unavailable" },
];

const EYE_COLOR_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "black", ar: "أسود", en: "Black" },
  { value: "blue", ar: "أزرق", en: "Blue" },
  { value: "green", ar: "أخضر", en: "Green" },
  { value: "hazel", ar: "عسلي", en: "Hazel" },
  { value: "gray", ar: "رمادي", en: "Gray" },
];

const HAIR_COLOR_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "black", ar: "أسود", en: "Black" },
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" },
  { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" },
  { value: "white", ar: "أبيض", en: "White" },
  { value: "dyed", ar: "مصبوغ", en: "Dyed" },
  { value: "bald", ar: "أصلع", en: "Bald" },
];

const HAIR_TYPE_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "straight", ar: "مستقيم", en: "Straight" },
  { value: "wavy", ar: "مموج", en: "Wavy" },
  { value: "curly", ar: "مجعد", en: "Curly" },
  { value: "coily", ar: "شديد التجعد", en: "Coily" },
  { value: "bald", ar: "أصلع", en: "Bald" },
  { value: "covered", ar: "مغطى", en: "Covered" },
];

const SKIN_COLOR_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "fair", ar: "فاتحة جدًا", en: "Fair" },
  { value: "light", ar: "فاتحة", en: "Light" },
  { value: "medium", ar: "متوسطة", en: "Medium" },
  { value: "olive", ar: "قمحية", en: "Olive" },
  { value: "tan", ar: "سمراء فاتحة", en: "Tan" },
  { value: "brown", ar: "بنية", en: "Brown" },
  { value: "dark", ar: "داكنة", en: "Dark" },
];

const CLOTHING_SIZE_OPTIONS: SelectOption[] = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

const EMPTY_FORM_DATA: TalentProfileFormData = {
  name_en: "",

  category_slug: "",
  city_slug: "",

  nationality: "",
  nationality_slug: "",

  gender: "",
  date_of_birth: "",

  languages: [],
  dialects: [],
  skills: [],

  bio_en: "",
  bio_ar: "",

  instagram: "",
  tiktok: "",
  snapchat: "",
  portfolio_url: "",

  availability_status: "available_now",

  height_cm: "",
  weight_kg: "",

  eye_color: "",
  hair_color: "",
  hair_type: "",
  skin_color: "",

  clothing_size: "",
  shoe_size: "",
  chest_size: "",
  waist_size: "",
  hip_size: "",

  experience_years: "",
  video_intro: "",
  showreel_url: "",

  ready_to_travel: false,
  has_passport: false,
  has_car: false,
  work_outside_city: false,
  work_outside_country: false,

  image_url: "",
  gallery_images: [],
};

function stringValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function stringArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        );
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function dateInputValue(value: unknown) {
  const rawValue = stringValue(value);

  if (!rawValue) {
    return "";
  }

  return rawValue.slice(0, 10);
}

function currentValueOptions(
  value: string,
  fallbackLabel?: string
): SelectOption[] {
  if (!value) {
    return [];
  }

  return [
    {
      value,
      label: fallbackLabel || value.replaceAll("_", " "),
    },
  ];
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-start transition ${
        checked
          ? "border-gold/45 bg-gold/[0.08]"
          : "border-white/10 bg-black/25 hover:border-gold/25"
      }`}
    >
      <span className="text-sm text-white/75">{label}</span>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-gold" : "bg-white/15"
        }`}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: checked ? "24px" : "4px" }}
        />
      </span>
    </button>
  );
}

function ChipMultiSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: SelectOption[];
  onChange: (value: string[]) => void;
}) {
  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue]
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selected
                  ? "border-gold bg-gold text-black"
                  : "border-white/10 bg-black/30 text-white/65 hover:border-gold/35 hover:text-gold"
              }`}
            >
              {selected ? "✓ " : ""}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TalentProfileEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isArabic = locale === "ar";

  const LANGUAGE_OPTIONS = useMemo(
    () =>
      localizeOptions(
        LANGUAGE_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const DIALECT_OPTIONS = useMemo(
    () =>
      localizeOptions(
        DIALECT_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const SKILL_OPTIONS = useMemo(
    () =>
      localizeOptions(
        SKILL_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const GENDER_OPTIONS = useMemo(
    () =>
      localizeOptions(
        GENDER_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const AVAILABILITY_OPTIONS = useMemo(
    () =>
      localizeOptions(
        AVAILABILITY_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const EYE_COLOR_OPTIONS = useMemo(
    () =>
      localizeOptions(
        EYE_COLOR_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const HAIR_COLOR_OPTIONS = useMemo(
    () =>
      localizeOptions(
        HAIR_COLOR_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const HAIR_TYPE_OPTIONS = useMemo(
    () =>
      localizeOptions(
        HAIR_TYPE_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const SKIN_COLOR_OPTIONS = useMemo(
    () =>
      localizeOptions(
        SKIN_COLOR_OPTION_DEFINITIONS,
        isArabic
      ),
    [isArabic]
  );

  const [formData, setFormData] =
    useState<TalentProfileFormData>(
      EMPTY_FORM_DATA
    );

  const [categoryOptions, setCategoryOptions] =
    useState<SelectOption[]>([]);

  const [cityOptions, setCityOptions] =
    useState<SelectOption[]>([]);

  const [
    nationalityOptions,
    setNationalityOptions,
  ] = useState<SelectOption[]>([]);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [loadError, setLoadError] = useState("");

  const profileReadyRef = useRef(false);
  const skipNextAutoSaveRef = useRef(true);

  useEffect(() => {
    let active = true;

    async function loadTalentProfile() {
      setLoadingProfile(true);
      setLoadError("");
      profileReadyRef.current = false;

      try {
        const talent =
          await getOwnTalentProfileAction();

        if (!active) {
          return;
        }

        if (!talent) {
          setLoadError(
            isArabic
              ? "لم يتم العثور على ملف موهبة مرتبط بهذا الحساب. يرجى إكمال إنشاء ملف الموهبة أولاً."
              : "No talent profile is linked to this account. Please complete talent profile creation first."
          );

          setLoadingProfile(false);
          return;
        }

        const nationality =
          stringValue(
            talent.nationality_slug
          ) ||
          stringValue(talent.nationality);

        const categorySlug = stringValue(
          talent.category_slug
        );

        const citySlug = stringValue(
          talent.city_slug
        );

        const loadedData: TalentProfileFormData =
          {
            name_en: stringValue(
              talent.name_en
            ),

            category_slug: categorySlug,
            city_slug: citySlug,

            nationality,
            nationality_slug: nationality,

            gender: stringValue(
              talent.gender
            ),

            date_of_birth: dateInputValue(
              talent.date_of_birth
            ),

            languages: stringArrayValue(
              talent.languages
            ),

            dialects: stringArrayValue(
              talent.dialects
            ),

            skills: stringArrayValue(
              talent.skills
            ),

            bio_en: stringValue(
              talent.bio_en
            ),

            bio_ar: stringValue(
              talent.bio_ar
            ),

            instagram: stringValue(
              talent.instagram
            ),

            tiktok: stringValue(
              talent.tiktok
            ),

            snapchat: stringValue(
              talent.snapchat
            ),

            portfolio_url: stringValue(
              talent.portfolio_url
            ),

            availability_status:
              stringValue(
                talent.availability_status
              ) || "available_now",

            height_cm: stringValue(
              talent.height_cm
            ),

            weight_kg: stringValue(
              talent.weight_kg
            ),

            eye_color: stringValue(
              talent.eye_color
            ),

            hair_color: stringValue(
              talent.hair_color
            ),

            hair_type: stringValue(
              talent.hair_type
            ),

            skin_color: stringValue(
              talent.skin_color
            ),

            clothing_size: stringValue(
              talent.clothing_size
            ),

            shoe_size: stringValue(
              talent.shoe_size
            ),

            chest_size: stringValue(
              talent.chest_size
            ),

            waist_size: stringValue(
              talent.waist_size
            ),

            hip_size: stringValue(
              talent.hip_size
            ),

            experience_years: stringValue(
              talent.experience_years
            ),

            video_intro: stringValue(
              talent.video_intro
            ),

            showreel_url: stringValue(
              talent.showreel_url
            ),

            ready_to_travel: Boolean(
              talent.ready_to_travel
            ),

            has_passport: Boolean(
              talent.has_passport
            ),

            has_car: Boolean(
              talent.has_car
            ),

            work_outside_city: Boolean(
              talent.work_outside_city
            ),

            work_outside_country: Boolean(
              talent.work_outside_country
            ),

            image_url: stringValue(
              talent.image_url
            ),

            gallery_images: stringArrayValue(
              talent.gallery_images
            ),
          };

          const fullCategoryOptions: SelectOption[] =
          TALENT_CATEGORIES.map((category) => ({
            value: category.slug,
            label: isArabic
              ? category.ar
              : category.en,
          }));

        if (
          categorySlug &&
          !fullCategoryOptions.some(
            (option) =>
              option.value === categorySlug
          )
        ) {
          fullCategoryOptions.unshift(
            ...currentValueOptions(
              categorySlug,
              isArabic
                ? stringValue(
                    talent.category_ar
                  ) || categorySlug
                : stringValue(
                    talent.category_en
                  ) || categorySlug
            )
          );
        }

        const fullCityOptions: SelectOption[] =
  SAUDI_CITIES.map((city) => ({
    value: city.slug,
    label: isArabic
      ? city.ar
      : city.en,
  }));

        if (
          citySlug &&
          !fullCityOptions.some(
            (option) =>
              option.value === citySlug
          )
        ) {
          fullCityOptions.unshift(
            ...currentValueOptions(
              citySlug,
              isArabic
                ? stringValue(
                    talent.city_ar
                  ) || citySlug
                : stringValue(
                    talent.city_en
                  ) || citySlug
            )
          );
        }

        setCategoryOptions(
          fullCategoryOptions
        );

        setCityOptions(fullCityOptions);

        const fullNationalityOptions: SelectOption[] = [
          { value: "saudi", label: isArabic ? "سعودي" : "Saudi" },
          { value: "emirati", label: isArabic ? "إماراتي" : "Emirati" },
          { value: "kuwaiti", label: isArabic ? "كويتي" : "Kuwaiti" },
          { value: "bahraini", label: isArabic ? "بحريني" : "Bahraini" },
          { value: "qatari", label: isArabic ? "قطري" : "Qatari" },
          { value: "omani", label: isArabic ? "عُماني" : "Omani" },
          { value: "yemeni", label: isArabic ? "يمني" : "Yemeni" },
          { value: "jordanian", label: isArabic ? "أردني" : "Jordanian" },
          { value: "palestinian", label: isArabic ? "فلسطيني" : "Palestinian" },
          { value: "lebanese", label: isArabic ? "لبناني" : "Lebanese" },
          { value: "syrian", label: isArabic ? "سوري" : "Syrian" },
          { value: "iraqi", label: isArabic ? "عراقي" : "Iraqi" },
          { value: "egyptian", label: isArabic ? "مصري" : "Egyptian" },
          { value: "sudanese", label: isArabic ? "سوداني" : "Sudanese" },
          { value: "moroccan", label: isArabic ? "مغربي" : "Moroccan" },
          { value: "algerian", label: isArabic ? "جزائري" : "Algerian" },
          { value: "tunisian", label: isArabic ? "تونسي" : "Tunisian" },
          { value: "libyan", label: isArabic ? "ليبي" : "Libyan" },
        ];
        
        if (
          nationality &&
          !fullNationalityOptions.some(
            (option) => option.value === nationality
          )
        ) {
          fullNationalityOptions.unshift({
            value: nationality,
            label: nationality,
          });
        }
        
        setNationalityOptions(fullNationalityOptions);

        skipNextAutoSaveRef.current = true;

        setFormData(loadedData);
        profileReadyRef.current = true;
        setLoadingProfile(false);
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Talent profile loading error:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : isArabic
              ? "تعذر تحميل بيانات الملف الشخصي."
              : "Unable to load profile data."
        );

        profileReadyRef.current = false;
        setLoadingProfile(false);
      }
    }

    loadTalentProfile();

    return () => {
      active = false;
    };
  }, [isArabic]);

  const updateField = useCallback(
    <K extends keyof TalentProfileFormData>(
      key: K,
      value: TalentProfileFormData[K]
    ) => {
      setFormData((previous) => ({
        ...previous,
        [key]: value,
      }));
    },
    []
  );

  const saveTalent = useCallback(
    async (data: TalentProfileFormData) => {
      if (!profileReadyRef.current) {
        return;
      }

      if (skipNextAutoSaveRef.current) {
        skipNextAutoSaveRef.current =
          false;

        return;
      }

      if (
        !data.category_slug.trim() ||
        !data.city_slug.trim() ||
        !data.image_url.trim()
      ) {
        return;
      }

      const payload = new FormData();

      Object.entries(data).forEach(
        ([key, value]) => {
          if (Array.isArray(value)) {
            payload.set(
              key,
              JSON.stringify(value)
            );

            return;
          }

          if (typeof value === "boolean") {
            payload.set(
              key,
              value ? "true" : "false"
            );

            return;
          }

          payload.set(key, value ?? "");
        }
      );

      payload.set(
        "nationality_slug",
        data.nationality_slug ||
          data.nationality
      );

      await updateOwnTalentProfileAction(
        payload
      );
    },
    []
  );

  const { status } = useAutoSave(
    formData,
    {
      delay: 1000,
      enabled:
        !loadingProfile &&
        !loadError &&
        profileReadyRef.current,
      onSave: saveTalent,
    }
  );

  const completion = useMemo(
    () =>
      TalentProfileService.calculateCompletion(
        formData
      ),
    [formData]
  );

  if (loadingProfile) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-6 text-white"
      >
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-gold" />

          <p className="mt-4 text-sm text-white/50">
            {isArabic
              ? "جارٍ تحميل الملف الشخصي..."
              : "Loading profile..."}
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-6 text-white"
      >
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
          <p className="text-sm leading-7 text-red-200">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-full border border-white/10 px-6 py-3 text-sm text-white/70 transition hover:border-gold/40 hover:text-gold"
          >
            {isArabic
              ? "إعادة المحاولة"
              : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 sm:pt-44 lg:pt-36"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold">
              {isArabic ? "لوحة الموهبة" : "Talent Workspace"}
            </p>

            <h1 className="mt-3 text-3xl font-light sm:text-5xl">
              {isArabic ? "إدارة الملف الشخصي" : "Manage Your Profile"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              {isArabic
                ? "حدّث معلوماتك الشخصية وبياناتك الاحترافية. تُحفظ جميع التغييرات تلقائيًا."
                : "Update your personal and professional details. All changes are saved automatically."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "error"
                  ? "bg-red-400"
                  : status === "saving"
                    ? "animate-pulse bg-gold"
                    : "bg-emerald-400"
              }`}
            />

            <span className="text-white/60">
              {status === "saving"
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : status === "error"
                  ? isArabic
                    ? "تعذر الحفظ"
                    : "Save failed"
                  : isArabic
                    ? "جميع التغييرات محفوظة"
                    : "All changes saved"}
            </span>
          </div>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 sm:p-6">
            <ProfileCompletionCard
              label={isArabic ? "اكتمال الملف الشخصي" : "Profile Completion"}
              value={completion}
            />
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
              {isArabic ? "نصيحة سريعة" : "Quick Tip"}
            </p>

            <h2 className="mt-3 text-xl font-light">
              {isArabic ? "أكمل الحقول الناقصة" : "Complete missing fields"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              {isArabic
                ? "كلما كان ملفك أكثر اكتمالًا، أصبحت فرص ظهوره للشركات والمنتجين أفضل."
                : "The more complete your profile is, the better your visibility to companies and producers."}
            </p>
          </div>
        </section>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-2">
          {[
            ["identity", isArabic ? "الهوية والخبرة" : "Identity"],
            ["about", isArabic ? "نبذة عنك" : "Bio"],
            ["measurements", isArabic ? "البيانات الجسدية" : "Physical"],
            ["experience", isArabic ? "الخبرة والتنقل" : "Experience"],
            ["links", isArabic ? "روابط التواصل" : "Links"],
          ].map(([href, label], index) => (
            <a
              key={href}
              href={`#${href}`}
              className={`shrink-0 rounded-xl border px-4 py-3 text-xs transition ${
                index === 0
                  ? "border-gold bg-gold text-black"
                  : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35 hover:text-gold"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="space-y-6 sm:space-y-8">
          <div id="identity" className="scroll-mt-28">
          <IdentityCard
            title={
              isArabic
                ? "الهوية"
                : "Identity"
            }
          >
            <TextField
              label={
                isArabic ? "الاسم" : "Name"
              }
              name="name_en"
              value={formData.name_en}
              onChange={(value) =>
                updateField(
                  "name_en",
                  value
                )
              }
            />

            <SelectField
              label={isArabic ? "الفئة" : "Category"}
              name="category_slug"
              value={formData.category_slug}
              options={categoryOptions}
              placeholder={isArabic ? "اختر الفئة" : "Select category"}
              onChange={(value) => updateField("category_slug", value)}
            />

            <SelectField
              label={isArabic ? "المدينة" : "City"}
              name="city_slug"
              value={formData.city_slug}
              options={cityOptions}
              placeholder={isArabic ? "اختر المدينة" : "Select city"}
              onChange={(value) => updateField("city_slug", value)}
            />

<SelectField
  label={isArabic ? "الجنسية" : "Nationality"}
  name="nationality_slug"
  value={formData.nationality_slug}
  options={nationalityOptions}
  placeholder={isArabic ? "اختر الجنسية" : "Select nationality"}
  onChange={(value) => {
    updateField("nationality_slug", value);
    updateField("nationality", value);
  }}
/>

            <SelectField
              label={
                isArabic
                  ? "الجنس"
                  : "Gender"
              }
              name="gender"
              value={formData.gender}
              options={GENDER_OPTIONS}
              placeholder={
                isArabic
                  ? "اختر"
                  : "Select"
              }
              onChange={(value) =>
                updateField(
                  "gender",
                  value
                )
              }
            />

<TextField
  label={isArabic ? "تاريخ الميلاد" : "Date of Birth"}
  name="date_of_birth"
  type="date"
  value={formData.date_of_birth}
  onChange={(value) =>
    updateField("date_of_birth", value)
  }
/>

            <ChipMultiSelect
              label={isArabic ? "اللغات" : "Languages"}
              value={formData.languages}
              options={LANGUAGE_OPTIONS}
              onChange={(value) => updateField("languages", value)}
            />

            <ChipMultiSelect
              label={isArabic ? "اللهجات" : "Dialects"}
              value={formData.dialects}
              options={DIALECT_OPTIONS}
              onChange={(value) => updateField("dialects", value)}
            />

            <ChipMultiSelect
              label={isArabic ? "المهارات" : "Skills"}
              value={formData.skills}
              options={SKILL_OPTIONS}
              onChange={(value) => updateField("skills", value)}
            />

            <SelectField
              label={
                isArabic
                  ? "حالة التوفر"
                  : "Availability"
              }
              name="availability_status"
              value={
                formData.availability_status
              }
              options={
                AVAILABILITY_OPTIONS
              }
              onChange={(value) =>
                updateField(
                  "availability_status",
                  value
                )
              }
            />
          </IdentityCard>
          </div>

          <div id="about" className="scroll-mt-28">
          <AboutCard
            title={
              isArabic ? "نبذة" : "Bio"
            }
          >
            <div className="grid gap-6">
              <TextAreaField
                label={
                  isArabic
                    ? "نبذة بالإنجليزية"
                    : "English Bio"
                }
                name="bio_en"
                value={formData.bio_en}
                dir="ltr"
                onChange={(value) =>
                  updateField(
                    "bio_en",
                    value
                  )
                }
              />

              <TextAreaField
                label={
                  isArabic
                    ? "نبذة بالعربية"
                    : "Arabic Bio"
                }
                name="bio_ar"
                value={formData.bio_ar}
                dir="rtl"
                onChange={(value) =>
                  updateField(
                    "bio_ar",
                    value
                  )
                }
              />
            </div>
          </AboutCard>
          </div>

          <div id="measurements" className="scroll-mt-28">
          <MeasurementsCard
            title={
              isArabic
                ? "البيانات الجسدية"
                : "Physical Details"
            }
            subtitle={
              isArabic
                ? "أدخل المقاسات والصفات الجسدية بدقة."
                : "Add accurate physical details and measurements."
            }
          >
            <TextField
              label={
                isArabic
                  ? "الطول بالسنتيمتر"
                  : "Height CM"
              }
              name="height_cm"
              type="number"
              value={formData.height_cm}
              onChange={(value) =>
                updateField(
                  "height_cm",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "الوزن بالكيلو"
                  : "Weight KG"
              }
              name="weight_kg"
              type="number"
              value={formData.weight_kg}
              onChange={(value) =>
                updateField(
                  "weight_kg",
                  value
                )
              }
            />

            <SelectField
              label={
                isArabic
                  ? "لون العين"
                  : "Eye Color"
              }
              name="eye_color"
              value={formData.eye_color}
              placeholder={isArabic ? "اختر" : "Select"}
              options={
                EYE_COLOR_OPTIONS
              }
              onChange={(value) =>
                updateField(
                  "eye_color",
                  value
                )
              }
            />

            <SelectField
              label={
                isArabic
                  ? "لون الشعر"
                  : "Hair Color"
              }
              name="hair_color"
              value={formData.hair_color}
              placeholder={isArabic ? "اختر" : "Select"}
              options={
                HAIR_COLOR_OPTIONS
              }
              onChange={(value) =>
                updateField(
                  "hair_color",
                  value
                )
              }
            />

            <SelectField
              label={
                isArabic
                  ? "نوع الشعر"
                  : "Hair Type"
              }
              name="hair_type"
              value={formData.hair_type}
              placeholder={isArabic ? "اختر" : "Select"}
              options={HAIR_TYPE_OPTIONS}
              onChange={(value) =>
                updateField(
                  "hair_type",
                  value
                )
              }
            />

            <SelectField
              label={
                isArabic
                  ? "لون البشرة"
                  : "Skin Color"
              }
              name="skin_color"
              value={formData.skin_color}
              placeholder={isArabic ? "اختر" : "Select"}
              options={SKIN_COLOR_OPTIONS}
              onChange={(value) =>
                updateField(
                  "skin_color",
                  value
                )
              }
            />

            <SelectField
              label={
                isArabic
                  ? "مقاس الملابس"
                  : "Clothing Size"
              }
              name="clothing_size"
              value={
                formData.clothing_size
              }
              options={
                CLOTHING_SIZE_OPTIONS
              }
              onChange={(value) =>
                updateField(
                  "clothing_size",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "مقاس الحذاء"
                  : "Shoe Size"
              }
              name="shoe_size"
              type="number"
              value={formData.shoe_size}
              onChange={(value) =>
                updateField(
                  "shoe_size",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "مقاس الصدر"
                  : "Chest Size"
              }
              name="chest_size"
              type="number"
              value={formData.chest_size}
              onChange={(value) =>
                updateField(
                  "chest_size",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "مقاس الخصر"
                  : "Waist Size"
              }
              name="waist_size"
              type="number"
              value={formData.waist_size}
              onChange={(value) =>
                updateField(
                  "waist_size",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "مقاس الورك"
                  : "Hip Size"
              }
              name="hip_size"
              type="number"
              value={formData.hip_size}
              onChange={(value) =>
                updateField(
                  "hip_size",
                  value
                )
              }
            />
          </MeasurementsCard>
          </div>

          <div id="experience" className="scroll-mt-28">
          <ExperienceCard
            title={
              isArabic
                ? "الخبرة والتنقل"
                : "Experience & Mobility"
            }
          >
            <TextField
              label={
                isArabic
                  ? "سنوات الخبرة"
                  : "Experience Years"
              }
              name="experience_years"
              type="number"
              value={
                formData.experience_years
              }
              onChange={(value) =>
                updateField(
                  "experience_years",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "رابط فيديو التعريف"
                  : "Video Intro URL"
              }
              name="video_intro"
              type="url"
              value={formData.video_intro}
              dir="ltr"
              onChange={(value) =>
                updateField(
                  "video_intro",
                  value
                )
              }
            />

            <TextField
              label={
                isArabic
                  ? "رابط الشوريل"
                  : "Showreel URL"
              }
              name="showreel_url"
              type="url"
              value={formData.showreel_url}
              dir="ltr"
              onChange={(value) =>
                updateField(
                  "showreel_url",
                  value
                )
              }
            />

            <BooleanField
              label={
                isArabic
                  ? "مستعد للسفر"
                  : "Ready to Travel"
              }
              checked={
                formData.ready_to_travel
              }
              onChange={(value) =>
                updateField(
                  "ready_to_travel",
                  value
                )
              }
            />

            <BooleanField
              label={
                isArabic
                  ? "لديه جواز سفر"
                  : "Has Passport"
              }
              checked={
                formData.has_passport
              }
              onChange={(value) =>
                updateField(
                  "has_passport",
                  value
                )
              }
            />

            <BooleanField
              label={
                isArabic
                  ? "لديه سيارة"
                  : "Has Car"
              }
              checked={formData.has_car}
              onChange={(value) =>
                updateField(
                  "has_car",
                  value
                )
              }
            />

            <BooleanField
              label={
                isArabic
                  ? "يعمل خارج المدينة"
                  : "Work Outside City"
              }
              checked={
                formData.work_outside_city
              }
              onChange={(value) =>
                updateField(
                  "work_outside_city",
                  value
                )
              }
            />

            <BooleanField
              label={
                isArabic
                  ? "يعمل خارج الدولة"
                  : "Work Outside Country"
              }
              checked={
                formData.work_outside_country
              }
              onChange={(value) =>
                updateField(
                  "work_outside_country",
                  value
                )
              }
            />
          </ExperienceCard>
          </div>

          <div id="links" className="scroll-mt-28">
          <AboutCard
            title={
              isArabic
                ? "روابط التواصل والأعمال"
                : "Links & Portfolio"
            }
          >
            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                label="Instagram"
                name="instagram"
                type="url"
                value={formData.instagram}
                dir="ltr"
                onChange={(value) =>
                  updateField(
                    "instagram",
                    value
                  )
                }
              />

              <TextField
                label="TikTok"
                name="tiktok"
                type="url"
                value={formData.tiktok}
                dir="ltr"
                onChange={(value) =>
                  updateField(
                    "tiktok",
                    value
                  )
                }
              />

              <TextField
                label="Snapchat"
                name="snapchat"
                type="url"
                value={formData.snapchat}
                dir="ltr"
                onChange={(value) =>
                  updateField(
                    "snapchat",
                    value
                  )
                }
              />

              <TextField
                label={
                  isArabic
                    ? "رابط معرض الأعمال"
                    : "Portfolio URL"
                }
                name="portfolio_url"
                type="url"
                value={
                  formData.portfolio_url
                }
                dir="ltr"
                onChange={(value) =>
                  updateField(
                    "portfolio_url",
                    value
                  )
                }
              />
            </div>
          </AboutCard>
          </div>
        </div>
      </div>
    </main>
  );
}