import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Ruler, Search, Sparkles, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { SingleSelectSheet, type SelectSheetOption } from "@/components/SingleSelectSheet";
import { getTalentProfile, updateTalentProfile, type MobileTalentProfile, type MobileTalentProfileUpdateInput } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { FALLBACK_NATIONALITY_OPTIONS, getCanonicalProfileOptions, type CanonicalMobileOption } from "@/lib/profile-options-api";
import { CLOTHING_SIZE_OPTIONS, EYE_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_TYPE_OPTIONS, SAUDI_CITY_OPTIONS, SKIN_COLOR_OPTIONS, TALENT_AVAILABILITY_OPTIONS, TALENT_GENDER_OPTIONS, type MobileOption } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

const TALENT_ROLE_OPTIONS: MobileOption[] = [
  { value: "actor", ar: "ممثل", en: "Actor" },
  { value: "model", ar: "مودل", en: "Model" },
];
const LANGUAGE_OPTIONS: MobileOption[] = [
  { value: "Arabic", ar: "العربية", en: "Arabic" }, { value: "English", ar: "الإنجليزية", en: "English" },
  { value: "French", ar: "الفرنسية", en: "French" }, { value: "Spanish", ar: "الإسبانية", en: "Spanish" },
  { value: "Turkish", ar: "التركية", en: "Turkish" }, { value: "Urdu", ar: "الأردية", en: "Urdu" },
  { value: "Hindi", ar: "الهندية", en: "Hindi" }, { value: "Italian", ar: "الإيطالية", en: "Italian" },
];
const SKILL_OPTIONS: MobileOption[] = [
  { value: "Acting", ar: "تمثيل", en: "Acting" }, { value: "Modeling", ar: "مودل", en: "Modeling" },
  { value: "Presenting", ar: "تقديم", en: "Presenting" }, { value: "Voice Over", ar: "تعليق صوتي", en: "Voice Over" },
  { value: "Dancing", ar: "رقص", en: "Dancing" }, { value: "Singing", ar: "غناء", en: "Singing" },
  { value: "Sports", ar: "رياضة", en: "Sports" }, { value: "Stunts", ar: "مشاهد حركية", en: "Stunts" },
];
const MODELING_TYPE_OPTIONS: MobileOption[] = [
  { value: "Commercial", ar: "إعلاني", en: "Commercial" }, { value: "Fashion", ar: "أزياء", en: "Fashion" },
  { value: "Editorial", ar: "تحريري", en: "Editorial" }, { value: "E-commerce", ar: "متاجر إلكترونية", en: "E-commerce" },
  { value: "Beauty", ar: "جمال", en: "Beauty" }, { value: "Lifestyle", ar: "لايف ستايل", en: "Lifestyle" },
  { value: "Fitness", ar: "لياقة", en: "Fitness" }, { value: "Runway", ar: "منصة عرض", en: "Runway" },
];

type SingleSheetKey = "city" | "nationality" | "clothing" | "eyes" | "hairColor" | "hairType" | "skin" | null;
type MultiSheetKey = "skills" | "languages" | "modeling" | null;

function sameArray(a: string[], b: string[]) { return JSON.stringify(a) === JSON.stringify(b); }
function latinDigits(value: string) { return value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))); }
function numericInput(value: string) { return latinDigits(value).replace(/[^0-9.]/g, ""); }
function integerInput(value: string) { return latinDigits(value).replace(/[^0-9]/g, ""); }
function toNumber(value: string) { const normalized = latinDigits(value).trim(); return normalized ? Number(normalized) : null; }
function optionLabel(value: string | null, options: Array<MobileOption | CanonicalMobileOption>, locale: "ar" | "en", fallback: string) { return value ? options.find((option) => option.value === value)?.[locale] ?? value : fallback; }
function localizeValues(values: string[], options: MobileOption[], locale: "ar" | "en") { return values.map((value) => options.find((option) => option.value === value)?.[locale] ?? value).join(" · "); }
function selectOptions(options: Array<MobileOption | CanonicalMobileOption>): SelectSheetOption[] { return options.map(({ value, ar, en }) => ({ value, ar, en })); }
function formatDate(value: string, locale: "ar" | "en") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return locale === "ar" ? "اختر تاريخ الميلاد" : "Choose date of birth";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return locale === "ar" ? "اختر تاريخ الميلاد" : "Choose date of birth";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export default function EditTalentProfileScreen() {
  const params = useLocalSearchParams<{ onboarding?: string }>();
  const onboarding = params.onboarding === "1";
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const align = isRtl ? "right" : "left";
  const insets = useSafeAreaInsets();
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [initial, setInitial] = useState<MobileTalentProfile | null>(null);
  const [primaryRole, setPrimaryRole] = useState<"actor" | "model" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [dialects, setDialects] = useState("");
  const [modelingTypes, setModelingTypes] = useState<string[]>([]);
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalitySlug, setNationalitySlug] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<CanonicalMobileOption[]>(SAUDI_CITY_OPTIONS);
  const [nationalityOptions, setNationalityOptions] = useState<CanonicalMobileOption[]>(FALLBACK_NATIONALITY_OPTIONS);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [eyeColor, setEyeColor] = useState<string | null>(null);
  const [hairColor, setHairColor] = useState<string | null>(null);
  const [hairType, setHairType] = useState<string | null>(null);
  const [skinColor, setSkinColor] = useState<string | null>(null);
  const [clothingSize, setClothingSize] = useState<string | null>(null);
  const [actingAgeMin, setActingAgeMin] = useState("");
  const [actingAgeMax, setActingAgeMax] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [readyToTravel, setReadyToTravel] = useState(false);
  const [hasPassport, setHasPassport] = useState(false);
  const [hasCar, setHasCar] = useState(false);
  const [workOutsideCity, setWorkOutsideCity] = useState(false);
  const [workOutsideCountry, setWorkOutsideCountry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [singleSheet, setSingleSheet] = useState<SingleSheetKey>(null);
  const [multiSheet, setMultiSheet] = useState<MultiSheetKey>(null);
  const [dobOpen, setDobOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [result, canonical] = await Promise.all([getTalentProfile(locale), getCanonicalProfileOptions()]);
        if (!active) return;
        setCityOptions(canonical.cities);
        setNationalityOptions(canonical.nationalities);
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } });
          else setError(isArabic ? "تعذر تحميل بيانات الملف." : "Unable to load profile details.");
          return;
        }
        const item = result.item;
        setInitial(item);
        setPrimaryRole(item.primaryRole);
        setDisplayName(item.displayName);
        setBio(item.bio ?? "");
        setSkills(item.skills);
        setLanguages(item.languages);
        setDialects(item.dialects.join(", "));
        setModelingTypes(item.modelingTypes);
        setCitySlug(item.citySlug);
        setGender(item.gender);
        setDateOfBirth(item.dateOfBirth ?? "");
        setNationalitySlug(item.nationalitySlug);
        setAvailabilityStatus(item.availabilityStatus);
        setHeightCm(item.heightCm == null ? "" : String(item.heightCm));
        setWeightKg(item.weightKg == null ? "" : String(item.weightKg));
        setShoeSize(item.shoeSize == null ? "" : String(item.shoeSize));
        setEyeColor(item.eyeColor);
        setHairColor(item.hairColor);
        setHairType(item.hairType);
        setSkinColor(item.skinColor);
        setClothingSize(item.clothingSize);
        setActingAgeMin(item.actingAgeMin == null ? "" : String(item.actingAgeMin));
        setActingAgeMax(item.actingAgeMax == null ? "" : String(item.actingAgeMax));
        setExperienceYears(item.experienceYears == null ? "" : String(item.experienceYears));
        setReadyToTravel(item.readyToTravel);
        setHasPassport(item.hasPassport);
        setHasCar(item.hasCar);
        setWorkOutsideCity(item.workOutsideCity);
        setWorkOutsideCountry(item.workOutsideCountry);
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل بيانات الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile details. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale]);

  const currentSnapshot = useMemo(() => ({
    primaryRole, displayName: displayName.trim(), bio: bio.trim(), skills, languages,
    dialects: dialects.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8), modelingTypes,
    citySlug, gender, dateOfBirth, nationalitySlug, availabilityStatus,
    heightCm: toNumber(heightCm), weightKg: toNumber(weightKg), shoeSize: toNumber(shoeSize),
    eyeColor, hairColor, hairType, skinColor, clothingSize,
    actingAgeMin: toNumber(actingAgeMin), actingAgeMax: toNumber(actingAgeMax), experienceYears: toNumber(experienceYears),
    readyToTravel, hasPassport, hasCar, workOutsideCity, workOutsideCountry,
  }), [actingAgeMax, actingAgeMin, availabilityStatus, bio, citySlug, clothingSize, dateOfBirth, dialects, displayName, experienceYears, eyeColor, gender, hairColor, hairType, hasCar, hasPassport, heightCm, languages, modelingTypes, nationalitySlug, primaryRole, readyToTravel, shoeSize, skills, skinColor, weightKg, workOutsideCity, workOutsideCountry]);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(currentSnapshot) !== JSON.stringify({
      primaryRole: initial.primaryRole, displayName: initial.displayName.trim(), bio: (initial.bio ?? "").trim(), skills: initial.skills, languages: initial.languages,
      dialects: initial.dialects, modelingTypes: initial.modelingTypes, citySlug: initial.citySlug, gender: initial.gender,
      dateOfBirth: initial.dateOfBirth ?? "", nationalitySlug: initial.nationalitySlug, availabilityStatus: initial.availabilityStatus,
      heightCm: initial.heightCm, weightKg: initial.weightKg, shoeSize: initial.shoeSize, eyeColor: initial.eyeColor, hairColor: initial.hairColor,
      hairType: initial.hairType, skinColor: initial.skinColor, clothingSize: initial.clothingSize,
      actingAgeMin: initial.actingAgeMin, actingAgeMax: initial.actingAgeMax, experienceYears: initial.experienceYears,
      readyToTravel: initial.readyToTravel, hasPassport: initial.hasPassport, hasCar: initial.hasCar,
      workOutsideCity: initial.workOutsideCity, workOutsideCountry: initial.workOutsideCountry,
    });
  }, [currentSnapshot, initial]);

  function leave() {
    if (!isDirty || saving) {
      if (onboarding) router.replace("/profile/journey"); else router.back();
      return;
    }
    Alert.alert(
      isArabic ? "لديك تغييرات غير محفوظة" : "You have unsaved changes",
      isArabic ? "احفظ التغييرات قبل الخروج أو اخرج بدون حفظ." : "Save your changes before leaving, or leave without saving.",
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isArabic ? "الخروج بدون حفظ" : "Leave without saving", style: "destructive", onPress: () => onboarding ? router.replace("/profile/journey") : router.back() },
        { text: isArabic ? "حفظ والمتابعة" : "Save & continue", onPress: () => void save() },
      ],
    );
  }

  function validateRequired() {
    if (!onboarding) return null;
    if (!primaryRole) return isArabic ? "اختر نوع الموهبة للمتابعة." : "Choose your talent type to continue.";
    if (displayName.trim().length < 2) return isArabic ? "أدخل الاسم المهني." : "Enter your professional name.";
    if (!citySlug) return isArabic ? "اختر المدينة." : "Choose your city.";
    if (!gender) return isArabic ? "اختر الجنس." : "Choose your gender.";
    if (!dateOfBirth) return isArabic ? "اختر تاريخ الميلاد." : "Choose your date of birth.";
    if (!nationalitySlug) return isArabic ? "اختر الجنسية." : "Choose your nationality.";
    return null;
  }

  function saveError(code: string) {
    const messages: Record<string, { ar: string; en: string }> = {
      INVALID_INPUT: { ar: "توجد قيمة غير صحيحة في أحد الحقول. راجع المقاسات والعمر والخبرة ثم حاول مرة أخرى.", en: "One field contains an invalid value. Check measurements, age and experience, then try again." },
      UPDATE_FAILED: { ar: "تعذر حفظ البيانات على الخادم الآن. حاول مرة أخرى بعد لحظات.", en: "The server could not save your profile right now. Please try again shortly." },
      TALENT_NOT_FOUND: { ar: "تعذر العثور على ملف الموهبة لهذا الحساب.", en: "The talent profile for this account could not be found." },
      UNAUTHENTICATED: { ar: "انتهت الجلسة. سجّل الدخول ثم حاول مرة أخرى.", en: "Your session expired. Sign in and try again." },
    };
    return messages[code]?.[locale] ?? (isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again.");
  }

  async function save() {
    if (saving || !initial) return;
    setError(null); setSuccess(null);
    const requiredError = validateRequired();
    if (requiredError) { setError(requiredError); return; }

    const height = toNumber(heightCm), weight = toNumber(weightKg), shoe = toNumber(shoeSize), ageMin = toNumber(actingAgeMin), ageMax = toNumber(actingAgeMax), experience = toNumber(experienceYears);
    if (displayName.trim().length > 80) return setError(isArabic ? "الاسم المهني يجب ألا يتجاوز 80 حرفًا." : "Professional name must be 80 characters or fewer.");
    if (bio.trim().length > 1200) return setError(isArabic ? "النبذة طويلة جدًا." : "Bio is too long.");
    if (height !== null && (!Number.isFinite(height) || height < 80 || height > 250)) return setError(isArabic ? "الطول يجب أن يكون بين 80 و250 سم." : "Height must be between 80 and 250 cm.");
    if (weight !== null && (!Number.isFinite(weight) || weight < 20 || weight > 350)) return setError(isArabic ? "الوزن يجب أن يكون بين 20 و350 كجم." : "Weight must be between 20 and 350 kg.");
    if (shoe !== null && (!Number.isFinite(shoe) || shoe < 15 || shoe > 60)) return setError(isArabic ? "مقاس الحذاء يجب أن يكون بين 15 و60." : "Shoe size must be between 15 and 60.");
    if (ageMin !== null && (!Number.isInteger(ageMin) || ageMin < 0 || ageMin > 120)) return setError(isArabic ? "العمر التمثيلي الأدنى غير صحيح." : "Acting age minimum is invalid.");
    if (ageMax !== null && (!Number.isInteger(ageMax) || ageMax < 0 || ageMax > 120)) return setError(isArabic ? "العمر التمثيلي الأعلى غير صحيح." : "Acting age maximum is invalid.");
    if (ageMin !== null && ageMax !== null && ageMin > ageMax) return setError(isArabic ? "العمر التمثيلي الأدنى لا يمكن أن يتجاوز الأعلى." : "Acting age minimum cannot exceed maximum.");
    if (experience !== null && (!Number.isInteger(experience) || experience < 0 || experience > 80)) return setError(isArabic ? "سنوات الخبرة يجب أن تكون بين 0 و80." : "Years of experience must be between 0 and 80.");

    const input: MobileTalentProfileUpdateInput = {};
    const dialectsArray = currentSnapshot.dialects;
    if (primaryRole !== initial.primaryRole) input.primaryRole = primaryRole;
    if (displayName.trim() !== initial.displayName) input.displayName = displayName.trim();
    if (bio.trim() !== (initial.bio ?? "")) input.bio = bio.trim();
    if (!sameArray(skills, initial.skills)) input.skills = skills;
    if (!sameArray(languages, initial.languages)) input.languages = languages;
    if (!sameArray(dialectsArray, initial.dialects)) input.dialects = dialectsArray;
    if (!sameArray(modelingTypes, initial.modelingTypes)) input.modelingTypes = modelingTypes;
    if (citySlug !== initial.citySlug) input.citySlug = citySlug;
    if (gender !== initial.gender) input.gender = gender;
    if (dateOfBirth !== (initial.dateOfBirth ?? "")) input.dateOfBirth = dateOfBirth || null;
    if (nationalitySlug !== initial.nationalitySlug) input.nationalitySlug = nationalitySlug;
    if (availabilityStatus !== initial.availabilityStatus) input.availabilityStatus = availabilityStatus;
    if (height !== initial.heightCm) input.heightCm = height;
    if (weight !== initial.weightKg) input.weightKg = weight;
    if (shoe !== initial.shoeSize) input.shoeSize = shoe;
    if (eyeColor !== initial.eyeColor) input.eyeColor = eyeColor;
    if (hairColor !== initial.hairColor) input.hairColor = hairColor;
    if (hairType !== initial.hairType) input.hairType = hairType;
    if (skinColor !== initial.skinColor) input.skinColor = skinColor;
    if (clothingSize !== initial.clothingSize) input.clothingSize = clothingSize;
    if (ageMin !== initial.actingAgeMin) input.actingAgeMin = ageMin;
    if (ageMax !== initial.actingAgeMax) input.actingAgeMax = ageMax;
    if (experience !== initial.experienceYears) input.experienceYears = experience;
    if (readyToTravel !== initial.readyToTravel) input.readyToTravel = readyToTravel;
    if (hasPassport !== initial.hasPassport) input.hasPassport = hasPassport;
    if (hasCar !== initial.hasCar) input.hasCar = hasCar;
    if (workOutsideCity !== initial.workOutsideCity) input.workOutsideCity = workOutsideCity;
    if (workOutsideCountry !== initial.workOutsideCountry) input.workOutsideCountry = workOutsideCountry;

    if (!Object.keys(input).length) {
      if (onboarding) { router.replace("/profile/journey"); return; }
      setSuccess(isArabic ? "ملفك محدث بالفعل." : "Your profile is already up to date.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateTalentProfile(locale, input);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } });
        setError(saveError(result.code));
        return;
      }
      setSuccess(isArabic ? "تم حفظ التغييرات بنجاح." : "Changes saved successfully.");
      setTimeout(() => router.replace(onboarding ? "/profile/journey" : "/profile"), 300);
    } catch {
      setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل محرر الملف" : "Loading profile editor"} />;

  const cityLabel = optionLabel(citySlug, cityOptions, locale, isArabic ? "اختر المدينة" : "Choose city");
  const nationalityLabel = optionLabel(nationalitySlug, nationalityOptions, locale, isArabic ? "اختر الجنسية" : "Choose nationality");
  const appearanceSheets: Record<Exclude<SingleSheetKey, "city" | "nationality" | null>, { title: string; options: MobileOption[]; value: string | null; set: (value: string) => void }> = {
    clothing: { title: isArabic ? "مقاس الملابس" : "Clothing size", options: CLOTHING_SIZE_OPTIONS, value: clothingSize, set: setClothingSize },
    eyes: { title: isArabic ? "لون العين" : "Eye color", options: EYE_COLOR_OPTIONS, value: eyeColor, set: setEyeColor },
    hairColor: { title: isArabic ? "لون الشعر" : "Hair color", options: HAIR_COLOR_OPTIONS, value: hairColor, set: setHairColor },
    hairType: { title: isArabic ? "نوع الشعر" : "Hair type", options: HAIR_TYPE_OPTIONS, value: hairType, set: setHairType },
    skin: { title: isArabic ? "لون البشرة" : "Skin tone", options: SKIN_COLOR_OPTIONS, value: skinColor, set: setSkinColor },
  };
  const activeAppearance = singleSheet && singleSheet !== "city" && singleSheet !== "nationality" ? appearanceSheets[singleSheet] : null;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 34, 52) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={leave} hitSlop={10} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9}/></Pressable>
        <Text style={styles.brand}>MLAMH</Text>
      </View>

      {onboarding ? <View style={styles.onboardingCard}><View style={[styles.onboardingCopy, isRtl && styles.rowRtl]}><Text style={[styles.onboardingLabel, isRtl && styles.textRtl]}>{isArabic ? "البيانات الأساسية والمهنية" : "Core & professional details"}</Text><Text style={styles.onboardingValue}>50%</Text></View><View style={styles.onboardingTrack}><View style={styles.onboardingFill}/></View></View> : null}

      <View style={styles.hero}>
        <View style={[styles.heroEyebrowRow, isRtl && styles.rowRtl]}><Sparkles size={14} color={theme.accent}/><Text style={[styles.heroEyebrow, isRtl && styles.textRtl]}>{isArabic ? "ملفك المهني" : "YOUR PROFESSIONAL PROFILE"}</Text></View>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "بيانات واضحة، فرص أفضل" : "Clear details, better opportunities"}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "أكمل المطلوب الآن، وأضف التفاصيل الاختيارية التي تساعد الجهات على فهم خبرتك ومظهرك المهني." : "Complete the required details now, then add optional information that helps publishers understand your experience and professional look."}</Text>
        <Text style={[styles.requiredLegend, isRtl && styles.textRtl]}><Text style={styles.requiredStar}>*</Text> {isArabic ? "حقل مطلوب" : "Required field"}</Text>
      </View>

      <Section title={isArabic ? "البيانات الأساسية" : "Core details"} subtitle={isArabic ? "المعلومات المطلوبة لإرسال ملفك للمراجعة" : "Required information for review submission"} styles={styles} isRtl={isRtl} defaultOpen>
        <RequiredLabel text={isArabic ? "نوع الموهبة" : "Talent type"} styles={styles} isRtl={isRtl}/>
        <OptionWrap options={TALENT_ROLE_OPTIONS} value={primaryRole} onChange={(value) => setPrimaryRole(value as "actor" | "model")} locale={locale} styles={styles}/>
        <Field label={isArabic ? "الاسم المهني" : "Professional name"} required value={displayName} onChangeText={setDisplayName} maxLength={80} styles={styles} align={align}/>
        <View style={[styles.marketCard, isRtl && styles.rowRtl]}><View style={styles.marketDot}/><View style={styles.marketCopy}><Text style={[styles.marketLabel, isRtl && styles.textRtl]}>{isArabic ? "السوق الحالي" : "Current market"}</Text><Text style={[styles.marketValue, isRtl && styles.textRtl]}>{isArabic ? "السعودية" : "Saudi Arabia"}</Text><Text style={[styles.marketHint, isRtl && styles.textRtl]}>{isArabic ? "سيتم إتاحة أسواق إضافية عند إطلاقها رسميًا." : "Additional markets will appear when officially launched."}</Text></View></View>
        <SelectorField label={isArabic ? "المدينة" : "City"} required value={cityLabel} onPress={() => setSingleSheet("city")} styles={styles} isRtl={isRtl}/>
        <RequiredLabel text={isArabic ? "الجنس" : "Gender"} styles={styles} isRtl={isRtl}/>
        <OptionWrap options={TALENT_GENDER_OPTIONS} value={gender} onChange={setGender} locale={locale} styles={styles}/>
        <SelectorField label={isArabic ? "تاريخ الميلاد" : "Date of birth"} required value={formatDate(dateOfBirth, locale)} icon={<CalendarDays size={18} color={theme.accent}/>} onPress={() => setDobOpen(true)} styles={styles} isRtl={isRtl}/>
        <SelectorField label={isArabic ? "الجنسية" : "Nationality"} required value={nationalityLabel} onPress={() => setSingleSheet("nationality")} styles={styles} isRtl={isRtl}/>
        <OptionalLabel text={isArabic ? "حالة التوفر" : "Availability"} styles={styles} isRtl={isRtl}/>
        <OptionWrap options={TALENT_AVAILABILITY_OPTIONS} value={availabilityStatus} onChange={setAvailabilityStatus} locale={locale} styles={styles}/>
      </Section>

      <Section title={isArabic ? "المقاسات والمظهر" : "Measurements & appearance"} subtitle={isArabic ? "اختياري — أضف ما تعرفه فقط" : "Optional — add only what you know"} styles={styles} isRtl={isRtl}>
        <View style={[styles.measureHero, isRtl && styles.rowRtl]}><View style={styles.measureIcon}><Ruler size={21} color={theme.accent}/></View><Text style={[styles.measureHint, isRtl && styles.textRtl]}>{isArabic ? "هذه البيانات اختيارية وتساعد في بعض أدوار الكاستينغ والمودل. لن تمنعك من حفظ الملف إذا تركتها فارغة." : "These details are optional and help with some casting and modeling roles. Leaving them blank will not block saving."}</Text></View>
        <View style={[styles.metricGrid, isRtl && styles.rowRtl]}>
          <MetricField label={isArabic ? "الطول" : "Height"} unit={isArabic ? "سم" : "cm"} value={heightCm} onChangeText={(value) => setHeightCm(numericInput(value))} styles={styles}/>
          <MetricField label={isArabic ? "الوزن" : "Weight"} unit={isArabic ? "كجم" : "kg"} value={weightKg} onChangeText={(value) => setWeightKg(numericInput(value))} styles={styles}/>
          <MetricField label={isArabic ? "الحذاء" : "Shoe"} unit={isArabic ? "مقاس" : "size"} value={shoeSize} onChangeText={(value) => setShoeSize(numericInput(value))} styles={styles}/>
        </View>
        <View style={styles.appearanceList}>
          <SelectorField label={isArabic ? "مقاس الملابس" : "Clothing size"} optional value={optionLabel(clothingSize, CLOTHING_SIZE_OPTIONS, locale, isArabic ? "غير محدد" : "Not set")} onPress={() => setSingleSheet("clothing")} styles={styles} isRtl={isRtl}/>
          <SelectorField label={isArabic ? "لون العين" : "Eye color"} optional value={optionLabel(eyeColor, EYE_COLOR_OPTIONS, locale, isArabic ? "غير محدد" : "Not set")} onPress={() => setSingleSheet("eyes")} styles={styles} isRtl={isRtl}/>
          <SelectorField label={isArabic ? "لون الشعر" : "Hair color"} optional value={optionLabel(hairColor, HAIR_COLOR_OPTIONS, locale, isArabic ? "غير محدد" : "Not set")} onPress={() => setSingleSheet("hairColor")} styles={styles} isRtl={isRtl}/>
          <SelectorField label={isArabic ? "نوع الشعر" : "Hair type"} optional value={optionLabel(hairType, HAIR_TYPE_OPTIONS, locale, isArabic ? "غير محدد" : "Not set")} onPress={() => setSingleSheet("hairType")} styles={styles} isRtl={isRtl}/>
          <SelectorField label={isArabic ? "لون البشرة" : "Skin tone"} optional value={optionLabel(skinColor, SKIN_COLOR_OPTIONS, locale, isArabic ? "غير محدد" : "Not set")} onPress={() => setSingleSheet("skin")} styles={styles} isRtl={isRtl}/>
        </View>
      </Section>

      <Section title={isArabic ? "الخبرة والمهارات" : "Experience & skills"} subtitle={isArabic ? "اختياري — عزز ملفك بما يميزك" : "Optional — strengthen your profile"} styles={styles} isRtl={isRtl}>
        <Field label={isArabic ? "نبذة مهنية" : "Professional bio"} optional value={bio} onChangeText={setBio} multiline maxLength={1200} styles={styles} align={align}/>
        <SelectorField label={isArabic ? "المهارات" : "Skills"} optional value={skills.length ? localizeValues(skills, SKILL_OPTIONS, locale) : (isArabic ? "اختر المهارات" : "Choose skills")} onPress={() => setMultiSheet("skills")} styles={styles} isRtl={isRtl}/>
        <SelectorField label={isArabic ? "اللغات" : "Languages"} optional value={languages.length ? localizeValues(languages, LANGUAGE_OPTIONS, locale) : (isArabic ? "اختر اللغات" : "Choose languages")} onPress={() => setMultiSheet("languages")} styles={styles} isRtl={isRtl}/>
        {primaryRole === "actor" ? <>
          <Field label={isArabic ? "اللهجات" : "Dialects"} optional value={dialects} onChangeText={setDialects} placeholder={isArabic ? "مثال: نجدي، حجازي" : "Example: Najdi, Hejazi"} styles={styles} align={align}/>
          <View style={[styles.twoCol, isRtl && styles.rowRtl]}><View style={styles.col}><Field label={isArabic ? "العمر التمثيلي من" : "Acting age min"} optional value={actingAgeMin} onChangeText={(value) => setActingAgeMin(integerInput(value))} keyboardType="number-pad" styles={styles} align={align}/></View><View style={styles.col}><Field label={isArabic ? "إلى" : "Max"} optional value={actingAgeMax} onChangeText={(value) => setActingAgeMax(integerInput(value))} keyboardType="number-pad" styles={styles} align={align}/></View></View>
        </> : <SelectorField label={isArabic ? "أنواع أعمال المودل" : "Modeling types"} optional value={modelingTypes.length ? localizeValues(modelingTypes, MODELING_TYPE_OPTIONS, locale) : (isArabic ? "اختر الأنواع" : "Choose modeling types")} onPress={() => setMultiSheet("modeling")} styles={styles} isRtl={isRtl}/>} 
        <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"} optional value={experienceYears} onChangeText={(value) => setExperienceYears(integerInput(value))} keyboardType="number-pad" styles={styles} align={align}/>
      </Section>

      <Section title={isArabic ? "التنقل والجاهزية" : "Mobility & readiness"} subtitle={isArabic ? "اختياري — حدد مرونتك للعمل والسفر" : "Optional — set your work and travel flexibility"} styles={styles} isRtl={isRtl}>
        <Toggle label={isArabic ? "جاهز للسفر" : "Ready to travel"} value={readyToTravel} onChange={setReadyToTravel} styles={styles} isRtl={isRtl}/>
        <Toggle label={isArabic ? "لدي جواز سفر" : "Has passport"} value={hasPassport} onChange={setHasPassport} styles={styles} isRtl={isRtl}/>
        <Toggle label={isArabic ? "لدي سيارة" : "Has car"} value={hasCar} onChange={setHasCar} styles={styles} isRtl={isRtl}/>
        <Toggle label={isArabic ? "أقبل العمل خارج المدينة" : "Work outside city"} value={workOutsideCity} onChange={setWorkOutsideCity} styles={styles} isRtl={isRtl}/>
        <Toggle label={isArabic ? "أقبل العمل خارج الدولة" : "Work outside country"} value={workOutsideCountry} onChange={setWorkOutsideCountry} styles={styles} isRtl={isRtl}/>
      </Section>

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, isRtl && styles.textRtl]}>{error}</Text></View> : null}
      {success ? <View style={styles.successBox}><Text accessibilityRole="alert" style={[styles.success, isRtl && styles.textRtl]}>{success}</Text></View> : null}

      <View style={styles.actionsCard}>
        <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color={theme.background}/> : <Text style={styles.saveText}>{onboarding ? (isArabic ? "حفظ ومتابعة" : "Save & continue") : (isArabic ? "حفظ التغييرات" : "Save changes")}</Text>}</Pressable>
        {!onboarding ? <Pressable onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={styles.reviewText}>{isArabic ? "مراجعة الجاهزية والإرسال" : "Review readiness & submit"}</Text></Pressable> : null}
      </View>
    </ScrollView>

    <SingleSelectSheet visible={singleSheet === "city"} title={isArabic ? "اختر المدينة" : "Choose city"} searchPlaceholder={isArabic ? "ابحث عن مدينة" : "Search city"} options={selectOptions(cityOptions)} value={citySlug} locale={locale} onClose={() => setSingleSheet(null)} onConfirm={(value) => { setCitySlug(value); setSingleSheet(null); }} />
    <SingleSelectSheet visible={singleSheet === "nationality"} title={isArabic ? "اختر الجنسية" : "Choose nationality"} searchPlaceholder={isArabic ? "ابحث بالعربية أو الإنجليزية" : "Search in Arabic or English"} options={selectOptions(nationalityOptions)} value={nationalitySlug} locale={locale} onClose={() => setSingleSheet(null)} onConfirm={(value) => { setNationalitySlug(value); setSingleSheet(null); }} />
    {activeAppearance && singleSheet ? <SingleSelectSheet visible title={activeAppearance.title} searchPlaceholder={isArabic ? "ابحث" : "Search"} options={selectOptions(activeAppearance.options)} value={activeAppearance.value} locale={locale} onClose={() => setSingleSheet(null)} onConfirm={(value) => { activeAppearance.set(value); setSingleSheet(null); }} /> : null}
    <MultiSelectSheet visible={multiSheet === "skills"} title={isArabic ? "المهارات" : "Skills"} options={SKILL_OPTIONS} values={skills} locale={locale} max={12} onClose={() => setMultiSheet(null)} onChange={setSkills} styles={styles}/>
    <MultiSelectSheet visible={multiSheet === "languages"} title={isArabic ? "اللغات" : "Languages"} options={LANGUAGE_OPTIONS} values={languages} locale={locale} max={8} onClose={() => setMultiSheet(null)} onChange={setLanguages} styles={styles}/>
    <MultiSelectSheet visible={multiSheet === "modeling"} title={isArabic ? "أنواع أعمال المودل" : "Modeling types"} options={MODELING_TYPE_OPTIONS} values={modelingTypes} locale={locale} max={8} onClose={() => setMultiSheet(null)} onChange={setModelingTypes} styles={styles}/>
    <DateSheet visible={dobOpen} value={dateOfBirth} locale={locale} onClose={() => setDobOpen(false)} onChange={setDateOfBirth} styles={styles}/>
  </KeyboardAvoidingView>;
}

function Section({ title, subtitle, children, styles, isRtl, defaultOpen = false }: { title: string; subtitle?: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <View style={[styles.section, open && styles.sectionOpen]}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={[styles.sectionHeader, isRtl && styles.rowRtl]}><View style={styles.sectionHeading}><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{title}</Text>{subtitle ? <Text numberOfLines={2} style={[styles.sectionSubtitle, isRtl && styles.textRtl]}>{subtitle}</Text> : null}</View><View style={[styles.sectionChevron, open && styles.sectionChevronOpen]}><ChevronDown size={18} color={open ? "#050505" : "#C9A962"}/></View></Pressable>{open ? <View style={styles.sectionBody}>{children}</View> : null}</View>;
}
function RequiredLabel({ text, styles, isRtl }: { text: string; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Text style={[styles.label, isRtl && styles.textRtl]}>{text} <Text style={styles.requiredStar}>*</Text></Text>; }
function OptionalLabel({ text, styles, isRtl }: { text: string; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Text style={[styles.label, isRtl && styles.textRtl]}>{text} <Text style={styles.optionalText}>{isRtl ? "(اختياري)" : "(optional)"}</Text></Text>; }
function Field({ label, required, optional, styles, align, ...props }: { label: string; required?: boolean; optional?: boolean; styles: ReturnType<typeof createStyles>; align: "left" | "right" } & React.ComponentProps<typeof TextInput>) { return <View style={styles.fieldWrap}><Text style={[styles.label, { textAlign: align, writingDirection: align === "right" ? "rtl" : "ltr" }]}>{label}{required ? <Text style={styles.requiredStar}> *</Text> : null}{optional ? <Text style={styles.optionalText}>{align === "right" ? " (اختياري)" : " (optional)"}</Text> : null}</Text><TextInput placeholderTextColor="#777771" style={[styles.input, { textAlign: align, writingDirection: align === "right" ? "rtl" : "ltr" }, props.multiline && styles.multiline]} {...props}/></View>; }
function MetricField({ label, unit, value, onChangeText, styles }: { label: string; unit: string; value: string; onChangeText: (value: string) => void; styles: ReturnType<typeof createStyles> }) { return <View style={styles.metricCard}><Text style={styles.metricLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="—" placeholderTextColor="#6F6F69" style={styles.metricInput}/><Text style={styles.metricUnit}>{unit}</Text></View>; }
function OptionWrap({ options, value, onChange, locale, styles }: { options: (MobileOption | CanonicalMobileOption)[]; value: string | null; onChange: (value: string | null) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <View style={[styles.options, locale === "ar" && styles.optionsRtl]}>{options.map((option) => <Pressable key={option.value} style={[styles.option, value === option.value && styles.optionActive]} onPress={() => onChange(option.value)}><Text numberOfLines={1} style={[styles.optionText, locale === "ar" && styles.textRtl, value === option.value && styles.optionTextActive]}>{option[locale]}</Text></Pressable>)}</View>; }
function SelectorField({ label, value, onPress, required, optional, icon, styles, isRtl }: { label: string; value: string; onPress: () => void; required?: boolean; optional?: boolean; icon?: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.fieldWrap}><Text style={[styles.label, isRtl && styles.textRtl]}>{label}{required ? <Text style={styles.requiredStar}> *</Text> : null}{optional ? <Text style={styles.optionalText}>{isRtl ? " (اختياري)" : " (optional)"}</Text> : null}</Text><Pressable onPress={onPress} style={[styles.selector, isRtl && styles.rowRtl]}>{icon}<Text numberOfLines={2} style={[styles.selectorText, isRtl && styles.textRtl]}>{value}</Text><ChevronDown size={18} color="#C9A962"/></Pressable></View>; }
function Toggle({ label, value, onChange, styles, isRtl }: { label: string; value: boolean; onChange: (value: boolean) => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={[styles.toggleRow, isRtl && styles.rowRtl]}><Text style={[styles.toggleLabel, isRtl && styles.textRtl]}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: "#282824", true: "#C9A96288" }} thumbColor={value ? "#C9A962" : "#8F8F89"}/></View>; }

function SheetShell({ visible, title, children, onClose, styles, locale }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void; styles: ReturnType<typeof createStyles>; locale: "ar" | "en" }) { const insets = useSafeAreaInsets(); const rtl = locale === "ar"; return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose}/><View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}><View style={styles.sheetHandle}/><View style={[styles.sheetHeader, rtl && styles.rowRtl]}><Text style={[styles.sheetTitle, rtl && styles.textRtl]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={rtl ? "إغلاق" : "Close"} onPress={onClose} style={styles.sheetClose}><X size={20} color="#F5F5F0"/></Pressable></View>{children}</View></View></Modal>; }
function MultiSelectSheet({ visible, title, options, values, locale, max, onClose, onChange, styles }: { visible: boolean; title: string; options: MobileOption[]; values: string[]; locale: "ar" | "en"; max: number; onClose: () => void; onChange: (values: string[]) => void; styles: ReturnType<typeof createStyles> }) { const rtl = locale === "ar"; const [query, setQuery] = useState(""); const filtered = options.filter((option) => !query.trim() || `${option.ar} ${option.en}`.toLowerCase().includes(query.trim().toLowerCase())); function toggle(value: string) { if (values.includes(value)) onChange(values.filter((item) => item !== value)); else if (values.length < max) onChange([...values, value]); } return <SheetShell visible={visible} title={title} onClose={() => { setQuery(""); onClose(); }} styles={styles} locale={locale}><View style={[styles.sheetSearch, rtl && styles.rowRtl]}><Search size={18} color="#8F8F89"/><TextInput value={query} onChangeText={setQuery} placeholder={rtl ? "ابحث" : "Search"} placeholderTextColor="#8F8F89" style={[styles.sheetSearchInput, rtl && styles.textRtl]}/></View><ScrollView style={styles.multiScroll} contentContainerStyle={[styles.multiGrid, rtl && styles.multiGridRtl]}>{filtered.map((option) => { const active = values.includes(option.value); return <Pressable key={option.value} onPress={() => toggle(option.value)} style={[styles.multiChip, rtl && styles.rowRtl, active && styles.multiChipActive]}><Text style={[styles.multiChipText, rtl && !active && styles.textRtl, active && styles.multiChipTextActive]}>{option[locale]}</Text>{active ? <Check size={16} color="#050505"/> : null}</Pressable>; })}</ScrollView><Pressable onPress={() => { setQuery(""); onClose(); }} style={styles.sheetDone}><Text style={styles.sheetDoneText}>{locale === "ar" ? "تم" : "Done"}</Text></Pressable></SheetShell>; }
function DateSheet({ visible, value, locale, onClose, onChange, styles }: { visible: boolean; value: string; locale: "ar" | "en"; onClose: () => void; onChange: (value: string) => void; styles: ReturnType<typeof createStyles> }) { const candidate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(2000, 0, 1); return <SheetShell visible={visible} title={locale === "ar" ? "تاريخ الميلاد" : "Date of birth"} onClose={onClose} styles={styles} locale={locale}><DateTimePicker value={candidate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} maximumDate={new Date()} minimumDate={new Date(1920, 0, 1)} locale={locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn"} onChange={(event, next) => { if (event.type === "dismissed") { onClose(); return; } if (next) onChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`); if (Platform.OS !== "ios") onClose(); }}/>{Platform.OS === "ios" ? <Pressable onPress={onClose} style={styles.sheetDone}><Text style={styles.sheetDoneText}>{locale === "ar" ? "تم" : "Done"}</Text></Pressable> : null}</SheetShell>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, gap: 14 }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 }, backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontWeight: "900", fontSize: 12, letterSpacing: 2.2 },
  onboardingCard: { borderWidth: 1, borderColor: "#C9A96233", borderRadius: 16, backgroundColor: "#C9A96208", padding: 12, gap: 8 }, onboardingCopy: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, onboardingLabel: { color: theme.text, fontSize: 11, fontWeight: "800" }, onboardingValue: { color: theme.accent, fontSize: 11, fontWeight: "900" }, onboardingTrack: { height: 4, borderRadius: 2, backgroundColor: "#FFFFFF12", overflow: "hidden" }, onboardingFill: { width: "50%", height: "100%", backgroundColor: theme.accent },
  hero: { gap: 8, paddingBottom: 4 }, heroEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 }, heroEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, title: { color: theme.text, fontSize: 30, lineHeight: 37, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21, maxWidth: 560 }, requiredLegend: { color: theme.muted, fontSize: 10, marginTop: 3 }, requiredStar: { color: theme.accent, fontWeight: "900" }, optionalText: { color: theme.muted, fontSize: 10, fontWeight: "500" },
  section: { borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, overflow: "hidden" }, sectionOpen: { borderColor: "#C9A96255" }, sectionHeader: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, sectionHeading: { flex: 1, gap: 4 }, sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "900" }, sectionSubtitle: { color: theme.muted, fontSize: 10, lineHeight: 15 }, sectionChevron: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#C9A96244", alignItems: "center", justifyContent: "center" }, sectionChevronOpen: { backgroundColor: theme.accent, borderColor: theme.accent, transform: [{ rotate: "180deg" }] }, sectionBody: { gap: 14, paddingHorizontal: 15, paddingBottom: 17, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 },
  label: { color: theme.text, fontSize: 12, fontWeight: "800" }, fieldWrap: { gap: 7 }, input: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 15, color: theme.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#080808" }, multiline: { minHeight: 112, textAlignVertical: "top" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, optionsRtl: { flexDirection: "row-reverse" }, option: { minHeight: 42, paddingHorizontal: 15, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", maxWidth: "100%" }, optionActive: { borderColor: theme.accent, backgroundColor: "#C9A9621A" }, optionText: { color: theme.muted, fontSize: 12, fontWeight: "700" }, optionTextActive: { color: theme.text },
  marketCard: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 16, backgroundColor: "#C9A96208", padding: 13 }, marketDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#49C991", marginTop: 5 }, marketCopy: { flex: 1, gap: 2 }, marketLabel: { color: theme.muted, fontSize: 10 }, marketValue: { color: theme.text, fontSize: 14, fontWeight: "900" }, marketHint: { color: theme.muted, fontSize: 9, lineHeight: 14 },
  selector: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#080808" }, selectorText: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 }, twoCol: { flexDirection: "row", gap: 10 }, col: { flex: 1 },
  measureHero: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 16, backgroundColor: "#C9A96208", borderWidth: 1, borderColor: "#C9A9622E", padding: 12 }, measureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#C9A96210", alignItems: "center", justifyContent: "center" }, measureHint: { flex: 1, color: theme.muted, fontSize: 10, lineHeight: 16 }, metricGrid: { flexDirection: "row", gap: 8 }, metricCard: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: "#090909", paddingHorizontal: 10, paddingVertical: 11, alignItems: "center", gap: 3 }, metricLabel: { color: theme.muted, fontSize: 9, fontWeight: "700" }, metricInput: { width: "100%", color: theme.text, fontSize: 22, lineHeight: 28, fontWeight: "800", textAlign: "center", paddingVertical: 3 }, metricUnit: { color: theme.accent, fontSize: 9, fontWeight: "800" }, appearanceList: { gap: 12 },
  toggleRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: theme.border, gap: 12 }, toggleLabel: { flex: 1, color: theme.text, fontSize: 13, fontWeight: "700" },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F12", borderRadius: 14, padding: 13 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, successBox: { borderWidth: 1, borderColor: "#49C99155", backgroundColor: "#49C9910D", borderRadius: 14, padding: 13 }, success: { color: "#73D7A9", fontSize: 12, lineHeight: 18 }, actionsCard: { gap: 10, paddingTop: 2 }, saveButton: { minHeight: 54, borderRadius: 15, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, saveText: { color: theme.background, fontSize: 15, fontWeight: "900" }, reviewButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, reviewText: { color: theme.text, fontSize: 14, fontWeight: "800" }, disabled: { opacity: .45 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000A8" }, sheet: { maxHeight: "72%", backgroundColor: "#101010", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: "#FFFFFF18", paddingHorizontal: 16, paddingTop: 9 }, sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF33", marginBottom: 9 }, sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46, marginBottom: 8 }, sheetTitle: { color: theme.text, fontSize: 18, fontWeight: "900", flex: 1 }, sheetClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF0F", alignItems: "center", justifyContent: "center" }, sheetSearch: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 12, marginBottom: 8 }, sheetSearchInput: { flex: 1, color: theme.text, fontSize: 14 }, multiScroll: { maxHeight: 330 }, multiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 6 }, multiGridRtl: { flexDirection: "row-reverse" }, multiChip: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, borderColor: theme.border }, multiChipActive: { backgroundColor: theme.accent, borderColor: theme.accent }, multiChipText: { color: theme.text, fontWeight: "700" }, multiChipTextActive: { color: theme.background }, sheetDone: { minHeight: 52, backgroundColor: theme.accent, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 12 }, sheetDoneText: { color: theme.background, fontSize: 15, fontWeight: "900" },
}); }
