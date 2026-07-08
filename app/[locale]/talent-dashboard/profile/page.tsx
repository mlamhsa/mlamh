"use client";

import { use, useCallback, useMemo, useState } from "react";

import { useAutoSave } from "@/hooks/useAutoSave";
import { updateOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";

import IdentityCard from "@/components/talent/profile/IdentityCard";
import AboutCard from "@/components/talent/profile/AboutCard";
import ProfileCompletionCard from "@/components/talent/profile/ProfileCompletionCard";

import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";

import {
  TextField,
  ComboBoxField,
  MultiSelectField,
  TextAreaField,
} from "@/components/forms/FormField";

type TalentProfileFormData = {
  name_en: string;
  category_slug: string;
  city_slug: string;
  nationality: string;
  skills: string[];
  bio_en: string;
  bio_ar: string;
};

const SKILL_OPTIONS = [
  { value: "acting", label: "Acting" },
  { value: "modeling", label: "Modeling" },
  { value: "voice_over", label: "Voice Over" },
  { value: "presenting", label: "Presenting" },
  { value: "singing", label: "Singing" },
  { value: "dancing", label: "Dancing" },
  { value: "sports", label: "Sports" },
];

const EMPTY_OPTIONS: { value: string; label: string }[] = [];

export default function TalentProfileEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isArabic = locale === "ar";

  const [formData, setFormData] = useState<TalentProfileFormData>({
    name_en: "",
    category_slug: "",
    city_slug: "",
    nationality: "",
    skills: [],
    bio_en: "",
    bio_ar: "",
  });

  const updateField = useCallback(
    <K extends keyof TalentProfileFormData>(
      key: K,
      value: TalentProfileFormData[K]
    ) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const saveTalent = useCallback(async (data: TalentProfileFormData) => {
    const payload = new FormData();
  
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        payload.append(key, JSON.stringify(value));
        return;
      }
  
      payload.append(key, value ?? "");
    });
  
    await updateOwnTalentProfileAction(payload);
  }, []);

  const { status } = useAutoSave(formData, {
    delay: 1000,
    onSave: saveTalent,
  });

  const completion = useMemo(
    () => TalentProfileService.calculateCompletion(formData),
    [formData]
  );

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 text-xs text-white/50">
          {status === "saving" && (isArabic ? "جارٍ الحفظ..." : "Saving...")}
          {status === "saved" && (isArabic ? "تم الحفظ ✓" : "Saved ✓")}
          {status === "error" && (isArabic ? "تعذر الحفظ" : "Error saving")}
        </div>

        <header className="mb-10 border-b border-white/10 pb-8">
          <ProfileCompletionCard
            label={isArabic ? "اكتمال الملف" : "Profile Completion"}
            value={completion}
          />
        </header>

        <div className="space-y-8">
          <IdentityCard title={isArabic ? "الهوية" : "Identity"}>
            <TextField
              label={isArabic ? "الاسم" : "Name"}
              name="name_en"
              value={formData.name_en}
              onChange={(value) => updateField("name_en", value)}
            />

            <ComboBoxField
              label={isArabic ? "الفئة" : "Category"}
              name="category_slug"
              value={formData.category_slug}
              options={EMPTY_OPTIONS}
              onChange={(value) => updateField("category_slug", value)}
            />

            <ComboBoxField
              label={isArabic ? "المدينة" : "City"}
              name="city_slug"
              value={formData.city_slug}
              options={EMPTY_OPTIONS}
              onChange={(value) => updateField("city_slug", value)}
            />

            <ComboBoxField
              label={isArabic ? "الجنسية" : "Nationality"}
              name="nationality"
              value={formData.nationality}
              options={EMPTY_OPTIONS}
              onChange={(value) => updateField("nationality", value)}
            />

            <MultiSelectField
              label={isArabic ? "المهارات" : "Skills"}
              name="skills"
              value={formData.skills}
              options={SKILL_OPTIONS}
              onChange={(value) => updateField("skills", value)}
            />
          </IdentityCard>

          <AboutCard title={isArabic ? "نبذة" : "Bio"}>
            <TextAreaField
              label={isArabic ? "نبذة بالإنجليزية" : "English Bio"}
              name="bio_en"
              value={formData.bio_en}
              dir="ltr"
              onChange={(value) => updateField("bio_en", value)}
            />

            <TextAreaField
              label={isArabic ? "نبذة بالعربية" : "Arabic Bio"}
              name="bio_ar"
              value={formData.bio_ar}
              dir="rtl"
              onChange={(value) => updateField("bio_ar", value)}
            />
          </AboutCard>
        </div>
      </div>
    </main>
  );
}