"use client";
import Link from "next/link";
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
  getOwnPendingTalentProfileChangeAction,
  getOwnTalentProfileAction,
  updateOwnTalentProfileAction,
} from "@/lib/actions/update-own-talent-profile";

import IdentityCard from "@/components/talent/profile/IdentityCard";
import { submitTalentProfileReviewAction } from "@/lib/actions/submit-talent-profile-review";
import AboutCard from "@/components/talent/profile/AboutCard";
import MeasurementsCard from "@/components/talent/profile/MeasurementsCard";
import ExperienceCard from "@/components/talent/profile/ExperienceCard";
import { isValidLocale, type Locale } from "@/lib/i18n";
import ProfileCompletionCard from "@/components/talent/profile/ProfileCompletionCard";

import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

import {
  TextField,
  SelectField,
  TextAreaField,
} from "@/components/forms/FormField";

type TalentProfileFormData = {
  name_en: string;
  name_ar: string;
  phone: string;

  category_slug: string;
  primary_role: string;
  acting_age_min: string;
  acting_age_max: string;
  modeling_types: string[];
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

type PendingProfileChange = {
  id: number | string;
  requested_name_ar: string | null;
  requested_name_en: string | null;
  requested_phone: string | null;
  requested_nationality_slug: string | null;
  status: string;
  created_at: string;
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

const PRIMARY_ROLE_OPTIONS: LocalizedOption[] = [
  { value: "actor", ar: "ممثل", en: "Actor" },
  { value: "model", ar: "مودل", en: "Model" },
];

const MODELING_TYPE_OPTION_DEFINITIONS: LocalizedOption[] = [
  { value: "commercial", ar: "إعلاني", en: "Commercial" },
  { value: "fashion", ar: "أزياء", en: "Fashion" },
  { value: "beauty", ar: "جمال", en: "Beauty" },
  { value: "lifestyle", ar: "لايف ستايل", en: "Lifestyle" },
  { value: "ecommerce", ar: "متاجر إلكترونية", en: "E-commerce" },
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
  name_ar: "",
  phone: "",

  category_slug: "",
  primary_role: "",
  acting_age_min: "",
  acting_age_max: "",
  modeling_types: [],
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


function PrimaryRoleSelector({
  value,
  isArabic,
  onChange,
}: {
  value: string;
  isArabic: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.13),transparent_45%),rgba(255,255,255,0.02)] p-4 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
        {isArabic ? "التخصص الأساسي" : "Primary Role"}
      </p>

      <h2 className="mt-3 text-xl font-light text-white sm:text-2xl">
      {isArabic
  ? "اختر نوع الموهبة *"
  : "Choose your talent type *"}
      </h2>

      <p className="mt-2 text-sm leading-7 text-white/45">
        {isArabic
          ? "سيتم تخصيص الحقول الظاهرة في ملفك حسب اختيارك."
          : "Your profile fields will adapt to the role you choose."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {PRIMARY_ROLE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`min-h-24 rounded-2xl border px-3 py-4 text-center transition active:scale-[0.98] sm:min-h-28 sm:px-5 ${
                selected
                  ? "border-gold bg-gold text-black shadow-lg shadow-gold/10"
                  : "border-white/10 bg-black/25 text-white/70 hover:border-gold/35 hover:text-gold"
              }`}
            >
              <span className="block text-2xl">
                {option.value === "actor" ? "🎭" : "◉"}
              </span>
              <span className="mt-2 block text-sm font-medium sm:text-base">
                {isArabic ? option.ar : option.en}
              </span>
              <span
                className={`mt-1 block text-[10px] ${
                  selected ? "text-black/55" : "text-white/35"
                }`}
              >
                {option.value === "actor"
                  ? isArabic
                    ? "تمثيل وإعلانات وأدوار"
                    : "Acting, commercials & roles"
                  : isArabic
                    ? "أزياء وإعلانات وتصوير"
                    : "Fashion, commercial & shoots"}
              </span>
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
  const { locale: localeParam } = use(params);

const locale: Locale = isValidLocale(localeParam)
  ? localeParam
  : "ar";

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

  const MODELING_TYPE_OPTIONS = useMemo(
    () =>
      localizeOptions(
        MODELING_TYPE_OPTION_DEFINITIONS,
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

    const [profileReady, setProfileReady] = useState(false);

    const [
      pendingProfileChange,
      setPendingProfileChange,
    ] = useState<PendingProfileChange | null>(null);

    const [
      approvalStatus,
      setApprovalStatus,
    ] = useState("not_submitted");
    
    const [
      reviewReason,
      setReviewReason,
    ] = useState("");
    
    const [
      submittingReview,
      setSubmittingReview,
    ] = useState(false);
    
    const [
      reviewSubmitMessage,
      setReviewSubmitMessage,
    ] = useState("");

    const profileReadyRef = useRef(false);
    const skipNextAutoSaveRef = useRef(true);
  useEffect(() => {
    let active = true;

    async function loadTalentProfile() {
      setLoadingProfile(true);
      setLoadError("");
      profileReadyRef.current = false;
      setProfileReady(false);
    
      try {
        const [
  talent,
  pendingChange,
] = await Promise.all([
  getOwnTalentProfileAction(locale),
  getOwnPendingTalentProfileChangeAction(locale),
]);

        if (!active) {
          return;
        }

        if (!talent) {
          setLoadError(
            isArabic
              ? "لم يتم العثور على ملف موهبة مرتبط بهذا الحساب. يرجى إكمال إنشاء ملف الموهبة أولاً."
              : "No talent profile is linked to this account. Please complete talent profile creation first."
          );

          profileReadyRef.current = false;
setProfileReady(false);
          setLoadingProfile(false);
          return;
        }
        setPendingProfileChange(
          pendingChange as PendingProfileChange | null,
        );

        setApprovalStatus(
          stringValue(
            talent.approval_status,
          ) || "not_submitted",
        );
        
        setReviewReason(
          stringValue(
            talent.review_reason,
          ).trim(),
        );

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

        const loadedData: TalentProfileFormData = {
          name_en: stringValue(
            talent.name_en
          ),
        
          name_ar: stringValue(
            talent.name_ar
          ),
        
          phone: stringValue(
            talent.phone
          ),
          category_slug: categorySlug,
          primary_role:
  stringValue(talent.primary_role) ||
  categorySlug,
          acting_age_min: stringValue(
            talent.acting_age_min
          ),
          acting_age_max: stringValue(
            talent.acting_age_max
          ),
          modeling_types: stringArrayValue(
            talent.modeling_types
          ),
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
setProfileReady(true);
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
setProfileReady(false);
setLoadingProfile(false);
      }
    }

    loadTalentProfile();

    return () => {
      active = false;
    };
  }, [isArabic, locale]);

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
        !data.primary_role.trim() ||
        !data.city_slug.trim()
      ) {
        return;
      }

      const payload = new FormData();

      payload.set("locale", locale);

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

      payload.set(
        "phone",
        data.phone.trim()
      );
      const result =
  await updateOwnTalentProfileAction(payload);

if (result.protectedChangePending) {
  const pendingChange =
    await getOwnPendingTalentProfileChangeAction(
      locale,
    );

  setPendingProfileChange(
    pendingChange as PendingProfileChange | null,
  );
}
    },
    [isArabic, locale]
  );


  const { status } = useAutoSave(
    formData,
    {
      delay: 1000,
      enabled:
        !loadingProfile &&
        !loadError &&
        profileReady,
      onSave: saveTalent,
    },
  );

  const resubmitProfileForReview =
  useCallback(async () => {
    if (
      submittingReview ||
      approvalStatus !==
        "changes_requested"
    ) {
      return;
    }

    if (status === "saving") {
      setReviewSubmitMessage(
        isArabic
          ? "انتظر حتى يكتمل حفظ التغييرات أولًا."
          : "Please wait until your changes are saved.",
      );

      return;
    }

    setSubmittingReview(true);
    setReviewSubmitMessage("");

    try {
      const result =
        await submitTalentProfileReviewAction(
          locale,
        );

      setReviewSubmitMessage(
        result.message,
      );

      if (result.success) {
        setApprovalStatus(
          "pending",
        );

        setReviewReason("");

        window.location.href =
          `/${locale}/talent-dashboard`;
      }
    } catch (error) {
      console.error(
        "[resubmitProfileForReview]",
        error,
      );

      setReviewSubmitMessage(
        isArabic
          ? "تعذر إعادة إرسال الملف للمراجعة."
          : "Unable to resubmit the profile for review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  }, [
    approvalStatus,
    isArabic,
    locale,
    submittingReview,
    status,
  ]);
  
  const completion = useMemo(
    () => calculateProfileCompletion(formData),
    [formData]
  );

  const profileReadiness = useMemo(
    () =>
      getTalentProfileReadiness({
        ...formData,
  
        name_ar:
          pendingProfileChange?.requested_name_ar?.trim() ||
          formData.name_ar,
  
        name_en:
          pendingProfileChange?.requested_name_en?.trim() ||
          formData.name_en,
  
        phone:
          pendingProfileChange?.requested_phone?.trim() ||
          formData.phone,
  
        nationality_slug:
          pendingProfileChange?.requested_nationality_slug?.trim() ||
          formData.nationality_slug,
      }),
    [formData, pendingProfileChange],
  );

  const isProfileReady =
    profileReadiness.isReady;

    const readinessPercentage =
  profileReadiness.totalRequirements > 0
    ? Math.round(
        (profileReadiness.completedRequirements /
          profileReadiness.totalRequirements) *
          100
      )
    : 0;

  function scrollToRequirement(key: string) {
    const sectionByRequirement: Record<string, string> = {
      // التخصص
      primary_role: "specialization",
  
      // الهوية
      name: "identity",
      phone: "identity",
      profile_image: "identity",
      city: "identity",
      gender: "identity",
      nationality: "identity",
      date_of_birth: "identity",
      languages: "identity",
  
      // النبذة
      bio: "about",
  
      // بيانات الممثل / المودل
      acting_age_range: "measurements",
      modeling_types: "measurements",
      height: "measurements",
      weight: "measurements",
  
      // الخبرة والتنقل
      experience: "experience",
  
      // الروابط
      portfolio: "links",
    };
  
    const sectionId =
      sectionByRequirement[key] ?? "specialization";
  
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

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
  ? "حدّث بيانات ملفك بسهولة. تُحفظ التغييرات تلقائيًا، بينما تحتاج بعض البيانات الأساسية إلى مراجعة قبل تطبيقها."
  : "Update your profile easily. Changes are saved automatically, while some protected information requires review before it is applied."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "error"
                  ? "bg-red-400"
                  : status === "saving"
                    ? "animate-pulse bg-gold"
                    : pendingProfileChange
                      ? "bg-gold"
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
      : pendingProfileChange
        ? isArabic
          ? "محفوظ • تعديل قيد المراجعة"
          : "Saved • Change under review"
        : isArabic
          ? "جميع التغييرات محفوظة"
          : "All changes saved"}
</span>
          </div>
          </div>

          {approvalStatus ===
"changes_requested" ? (
  <section className="mb-6 rounded-[1.75rem] border border-orange-400/25 bg-orange-400/[0.06] p-5 sm:p-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <span className="inline-flex rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-300">
          {isArabic
            ? "مطلوب تعديل"
            : "Changes required"}
        </span>

        <h2 className="mt-4 text-2xl font-light text-white">
          {isArabic
            ? "تعديلات مطلوبة من فريق ملامح"
            : "Changes requested by MLAMH"}
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/55">
          {isArabic
            ? "أجرِ التعديلات المطلوبة على ملفك. تُحفظ التغييرات تلقائيًا، وبعد الانتهاء أعد إرسال الملف للمراجعة."
            : "Make the requested changes to your profile. Changes are saved automatically, then resubmit the profile for review."}
        </p>

        {reviewReason ? (
          <div className="mt-4 rounded-2xl border border-orange-400/15 bg-black/20 px-4 py-4">
            <p className="text-[11px] text-orange-300/70">
              {isArabic
                ? "التعديلات المطلوبة"
                : "Requested changes"}
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/75">
              {reviewReason}
            </p>
          </div>
        ) : null}

        {reviewSubmitMessage ? (
          <p className="mt-4 text-sm text-orange-200">
            {reviewSubmitMessage}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        disabled={
          submittingReview ||
          status === "saving"
        }
        onClick={
          resubmitProfileForReview
        }
        className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-6 text-sm text-gold transition hover:bg-gold hover:text-black disabled:cursor-wait disabled:opacity-40"
      >
        {submittingReview
          ? isArabic
            ? "جارٍ الإرسال..."
            : "Submitting..."
          : isArabic
            ? "إعادة إرسال الملف للمراجعة"
            : "Resubmit for review"}
      </button>
    </div>
  </section>
) : null}

          {status === "saved" && !pendingProfileChange ? (
  <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
    {isArabic
      ? "تم حفظ التغييرات."
      : "Changes saved."}
  </div>
) : null}
{pendingProfileChange ? (
  <section className="mb-6 rounded-[1.75rem] border border-amber-400/25 bg-amber-400/[0.06] p-5 sm:p-6">
    <div className="flex flex-col gap-4">
      <div>
        <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
          {isArabic
            ? "قيد المراجعة"
            : "Under review"}
        </span>

        <h2 className="mt-4 text-xl font-light text-white">
          {isArabic
            ? "طلب تعديل بياناتك قيد المراجعة"
            : "Your profile change request is under review"}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
          {isArabic
            ? "تم استلام طلب تعديل بياناتك الأساسية. ستبقى البيانات الحالية معتمدة إلى أن تراجع الإدارة الطلب، ويمكنك الاستمرار في استخدام المنصة والتقديم على الفرص."
            : "Your protected profile changes have been received. Your current data remains active until the request is reviewed, and you can continue using the platform and applying to opportunities."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pendingProfileChange.requested_name_ar ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              {isArabic
                ? "الاسم بالعربية المطلوب"
                : "Requested Arabic name"}
            </p>

            <p
              dir="rtl"
              className="mt-2 text-sm text-amber-200"
            >
              {
                pendingProfileChange.requested_name_ar
              }
            </p>
          </div>
        ) : null}

{pendingProfileChange.requested_name_en ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              {isArabic
                ? "الاسم بالإنجليزية المطلوب"
                : "Requested English name"}
            </p>

            <p
              dir="ltr"
              className="mt-2 text-sm text-amber-200"
            >
              {
                pendingProfileChange.requested_name_en
              }
            </p>
          </div>
        ) : null}

{pendingProfileChange.requested_phone ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              {isArabic
                ? "رقم الجوال المطلوب"
                : "Requested phone number"}
            </p>

            <p
              dir="ltr"
              className="mt-2 text-sm text-amber-200"
            >
              {
                pendingProfileChange.requested_phone
              }
            </p>
          </div>
        ) : null}

{pendingProfileChange.requested_nationality_slug ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              {isArabic
                ? "الجنسية المطلوبة"
                : "Requested nationality"}
            </p>

            <p className="mt-2 text-sm text-amber-200">
              {nationalityOptions.find(
                (option) =>
                  option.value ===
                  pendingProfileChange.requested_nationality_slug,
              )?.label ??
                pendingProfileChange.requested_nationality_slug}
            </p>
          </div>
        ) : null}
      </div>

    </div>
  </section>
) : null}

<section className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 sm:p-6">
            <ProfileCompletionCard
  label={
    isArabic
      ? "قوة الملف المهني"
      : "Profile Strength"
  }
  value={completion}
/>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
  <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
    {isArabic ? "حالة الملف" : "Profile Status"}
  </p>

  <h2 className="mt-3 text-xl font-light">
    {completion >= 100
      ? isArabic
        ? "ملفك مكتمل"
        : "Your profile is complete"
      : isArabic
        ? "طوّر ملفك أكثر"
        : "Improve your profile"}
  </h2>

  <p className="mt-3 text-sm leading-7 text-white/50">
    {completion >= 100
      ? isArabic
        ? "أكملت جميع بيانات ملفك الحالية."
        : "You have completed all current profile information."
      : isArabic
        ? "إضافة المزيد من البيانات الاختيارية قد تساعد في تحسين ظهور ملفك للجهات."
        : "Adding more optional information may help improve your profile visibility."}
  </p>
</div>
        </section>
        <section className="mb-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025]">
  <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          {isArabic
            ? "معرض الأعمال"
            : "Portfolio Gallery"}
        </p>

        <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/50">
          {formData.gallery_images.length} / 20
        </span>
      </div>

      <h2 className="mt-3 text-xl font-light text-white sm:text-2xl">
        {formData.gallery_images.length > 0
          ? isArabic
            ? "اعرض أفضل أعمالك"
            : "Showcase Your Best Work"
          : isArabic
            ? "أضف أعمالك إلى ملفك"
            : "Add Work to Your Profile"}
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
        {formData.gallery_images.length > 0
          ? isArabic
            ? `لديك ${formData.gallery_images.length} ${
                formData.gallery_images.length === 1
                  ? "صورة"
                  : "صور"
              } في معرض أعمالك. يمكنك إضافة صور جديدة أو إعادة ترتيبها.`
            : `You have ${formData.gallery_images.length} ${
                formData.gallery_images.length === 1
                  ? "image"
                  : "images"
              } in your portfolio. Add more or rearrange them anytime.`
          : isArabic
            ? "معرض الأعمال يساعد الجهات والناشرين على مشاهدة صورك وأعمالك المهنية قبل التواصل معك."
            : "Your portfolio helps publishers and companies review your professional work before contacting you."}
      </p>
    </div>

    <Link
      href={`/${locale}/talent-dashboard/gallery`}
      className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold/[0.08] px-6 text-sm text-gold transition hover:bg-gold hover:text-black active:scale-[0.98] sm:w-auto"
    >
      <span>
        {formData.gallery_images.length > 0
          ? isArabic
            ? "إدارة معرض الأعمال"
            : "Manage Portfolio"
          : isArabic
            ? "إضافة أعمال"
            : "Add Portfolio"}
      </span>

      <span aria-hidden="true">
        {isArabic ? "←" : "→"}
      </span>
    </Link>
  </div>
</section>
        {!isProfileReady ? (
  <section className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
          {isArabic
            ? "بيانات مطلوبة"
            : "Required information"}
        </span>

        <h2 className="mt-4 text-2xl font-light text-white">
          {isArabic
            ? "أكمل البيانات الأساسية"
            : "Complete the required information"}
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/55">
        {isArabic
  ? `جاهزية ملفك للتقديم ${readinessPercentage}٪. أكمل العناصر التالية لتتمكن من التقديم على الفرص.`
  : `Your application readiness is ${readinessPercentage}%. Complete the following items to start applying.`}
        </p>

        {profileReadiness.missingRequirements.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {profileReadiness.missingRequirements.map(
              (requirement) => (
                <button
                  key={requirement.key}
                  type="button"
                  onClick={() =>
                    scrollToRequirement(
                      requirement.key,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs text-amber-200 transition hover:border-gold/45 hover:bg-gold/10 hover:text-gold active:scale-[0.97]"
                  title={
                    isArabic
                      ? `انتقل إلى ${requirement.ar}`
                      : `Go to ${requirement.en}`
                  }
                >
                  <span>
                    {isArabic
                      ? requirement.ar
                      : requirement.en}
                  </span>

                  <span
                    aria-hidden="true"
                    className="text-[10px] opacity-60"
                  >
                    {isArabic ? "←" : "→"}
                  </span>
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  </section>
) : null}

{isProfileReady ? (
  <section className="mb-6 rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/[0.05] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
          {isArabic
            ? "جاهز للتقديم"
            : "Ready to apply"}
        </span>

        <h2 className="mt-4 text-2xl font-light text-white">
          {isArabic
            ? "ملفك يستوفي المتطلبات الأساسية"
            : "Your profile meets the requirements"}
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/55">
          {isArabic
            ? "يمكنك الآن تصفح الفرص والتقديم عليها باستخدام ملفك المهني."
            : "You can now browse and apply to opportunities using your professional profile."}
        </p>
      </div>

      <Link
        href={`/${locale}/opportunities`}
        className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 px-6 text-sm text-emerald-200 transition hover:bg-emerald-400/10"
      >
        {isArabic
          ? "استعراض الفرص"
          : "Browse opportunities"}
      </Link>
    </div>
  </section>
) : null}

<nav
  className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  aria-label={
    isArabic
      ? "أقسام الملف الشخصي"
      : "Profile sections"
  }
>
  {[
    ["specialization", isArabic ? "التخصص" : "Role"],
    ["identity", isArabic ? "الهوية والخبرة" : "Identity"],
    ["about", isArabic ? "نبذة عنك" : "Bio"],
    ["measurements", isArabic ? "البيانات الجسدية" : "Physical"],
    ["experience", isArabic ? "الخبرة والتنقل" : "Experience"],
    ["links", isArabic ? "روابط التواصل" : "Links"],
  ].map(([href, label], index) => (
    <a
      key={href}
      href={`#${href}`}
      className={`shrink-0 whitespace-nowrap rounded-xl border px-4 py-3 text-xs transition ${
        index === 0
          ? "border-gold bg-gold text-black"
          : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35 hover:text-gold"
      }`}
    >
      {label}
    </a>
  ))}

  <Link
    href={`/${locale}/talent-dashboard/gallery`}
    className="shrink-0 whitespace-nowrap rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-xs text-gold transition hover:border-gold/50 hover:bg-gold/10"
  >
    {isArabic
      ? `معرض الأعمال (${formData.gallery_images.length})`
      : `Portfolio (${formData.gallery_images.length})`}
  </Link>
</nav>

        <div className="space-y-6 sm:space-y-8">
          <div id="specialization" className="scroll-mt-28">
          <PrimaryRoleSelector
  value={formData.primary_role}
  isArabic={isArabic}
  onChange={(value) => {
    setFormData((previous) => ({
      ...previous,
      primary_role: value,
      category_slug: value,
    }));
  }}
/>
          </div>

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
    isArabic
      ? "الاسم بالإنجليزية"
: "Professional Name *"
  }
  name="name_en"
  value={formData.name_en}
  dir="ltr"
  onChange={(value) =>
    updateField(
      "name_en",
      value
    )
  }
/>

<TextField
  label={
    isArabic
      ? "الاسم المهني *"
: "Arabic Name"
  }
  name="name_ar"
  value={formData.name_ar}
  dir="rtl"
  onChange={(value) =>
    updateField(
      "name_ar",
      value
    )
  }
/>
<div>
  <label
    htmlFor="phone"
    className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40"
  >
    {isArabic
      ? "رقم الجوال"
      : "Phone Number"}
  </label>

  <input
  id="phone"
  name="phone"
  type="tel"
  value={formData.phone}
  onChange={(event) =>
    updateField("phone", event.target.value)
  }
  dir="ltr"
  className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-white outline-none transition focus:border-[#d6b36a]/45"
/>

</div>

            <SelectField
              label={isArabic ? "المدينة *" : "City *"}
              name="city_slug"
              value={formData.city_slug}
              options={cityOptions}
              placeholder={isArabic ? "اختر المدينة" : "Select city"}
              onChange={(value) => updateField("city_slug", value)}
            />

<SelectField
  label={isArabic ? "الجنسية *" : "Nationality *"}
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
                  ? "الجنس *"
                  : "Gender *"
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
  label={
    isArabic
      ? "تاريخ الميلاد *"
      : "Date of Birth *"
  }
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
                formData.primary_role === "actor"
                  ? isArabic
                    ? "بيانات الممثل"
                    : "Actor Details"
                  : formData.primary_role === "model"
                    ? isArabic
                      ? "بيانات المودل"
                      : "Model Details"
                    : isArabic
                      ? "البيانات المهنية"
                      : "Professional Details"
              }
              subtitle={
                formData.primary_role === "actor"
                  ? isArabic
                    ? "أضف العمر التمثيلي والصفات الجسدية المهمة للكاستينغ."
                    : "Add your acting age range and key casting details."
                  : formData.primary_role === "model"
                    ? isArabic
                      ? "أدخل المقاسات والصفات المطلوبة لأعمال المودل بدقة."
                      : "Add accurate measurements and modeling details."
                    : isArabic
                      ? "اختر نوع الموهبة أولًا لإظهار الحقول المناسبة."
                      : "Choose your talent type first to show the relevant fields."
              }
            >
              {formData.primary_role === "actor" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                    <TextField
                      label={
                        isArabic
                          ? "العمر التمثيلي من"
                          : "Acting Age From"
                      }
                      name="acting_age_min"
                      type="number"
                      value={formData.acting_age_min}
                      onChange={(value) =>
                        updateField("acting_age_min", value)
                      }
                    />

                    <TextField
                      label={
                        isArabic
                          ? "العمر التمثيلي إلى"
                          : "Acting Age To"
                      }
                      name="acting_age_max"
                      type="number"
                      value={formData.acting_age_max}
                      onChange={(value) =>
                        updateField("acting_age_max", value)
                      }
                    />
                  </div>

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
                      updateField("height_cm", value)
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
                      updateField("weight_kg", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون العين" : "Eye Color"}
                    name="eye_color"
                    value={formData.eye_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={EYE_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("eye_color", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون الشعر" : "Hair Color"}
                    name="hair_color"
                    value={formData.hair_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={HAIR_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("hair_color", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "نوع الشعر" : "Hair Type"}
                    name="hair_type"
                    value={formData.hair_type}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={HAIR_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateField("hair_type", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون البشرة" : "Skin Color"}
                    name="skin_color"
                    value={formData.skin_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={SKIN_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("skin_color", value)
                    }
                  />
                </>
              ) : formData.primary_role === "model" ? (
                <>
                  <ChipMultiSelect
                    label={
                      isArabic
                        ? "نوع أعمال المودل"
                        : "Modeling Types"
                    }
                    value={formData.modeling_types}
                    options={MODELING_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateField("modeling_types", value)
                    }
                  />

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
                      updateField("height_cm", value)
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
                      updateField("weight_kg", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون العين" : "Eye Color"}
                    name="eye_color"
                    value={formData.eye_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={EYE_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("eye_color", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون الشعر" : "Hair Color"}
                    name="hair_color"
                    value={formData.hair_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={HAIR_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("hair_color", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "نوع الشعر" : "Hair Type"}
                    name="hair_type"
                    value={formData.hair_type}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={HAIR_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateField("hair_type", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "لون البشرة" : "Skin Color"}
                    name="skin_color"
                    value={formData.skin_color}
                    placeholder={isArabic ? "اختر" : "Select"}
                    options={SKIN_COLOR_OPTIONS}
                    onChange={(value) =>
                      updateField("skin_color", value)
                    }
                  />

                  <SelectField
                    label={isArabic ? "مقاس الملابس" : "Clothing Size"}
                    name="clothing_size"
                    value={formData.clothing_size}
                    options={CLOTHING_SIZE_OPTIONS}
                    onChange={(value) =>
                      updateField("clothing_size", value)
                    }
                  />

                  <TextField
                    label={isArabic ? "مقاس الحذاء" : "Shoe Size"}
                    name="shoe_size"
                    type="number"
                    value={formData.shoe_size}
                    onChange={(value) =>
                      updateField("shoe_size", value)
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
                    <TextField
                      label={isArabic ? "مقاس الصدر" : "Chest Size"}
                      name="chest_size"
                      type="number"
                      value={formData.chest_size}
                      onChange={(value) =>
                        updateField("chest_size", value)
                      }
                    />

                    <TextField
                      label={isArabic ? "مقاس الخصر" : "Waist Size"}
                      name="waist_size"
                      type="number"
                      value={formData.waist_size}
                      onChange={(value) =>
                        updateField("waist_size", value)
                      }
                    />

                    <TextField
                      label={isArabic ? "مقاس الورك" : "Hip Size"}
                      name="hip_size"
                      type="number"
                      value={formData.hip_size}
                      onChange={(value) =>
                        updateField("hip_size", value)
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-5 text-sm leading-7 text-amber-200">
                  {isArabic
                    ? "اختر «ممثل» أو «مودل» من قسم التخصص لعرض الحقول المناسبة."
                    : "Choose Actor or Model in the Role section to display the relevant fields."}
                </div>
              )}
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

            {formData.primary_role === "actor" ? (
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
            ) : null}

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
