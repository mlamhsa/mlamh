import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, Check, ChevronDown, Search, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getTalentProfile, updateTalentProfile, type MobileTalentProfile, type MobileTalentProfileUpdateInput } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getCanonicalProfileOptions, type CanonicalMobileOption } from "@/lib/profile-options-api";
import { CLOTHING_SIZE_OPTIONS, EYE_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_TYPE_OPTIONS, SAUDI_CITY_OPTIONS, SKIN_COLOR_OPTIONS, TALENT_AVAILABILITY_OPTIONS, TALENT_GENDER_OPTIONS, type MobileOption } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

const TALENT_ROLE_OPTIONS: MobileOption[] = [{ value: "actor", ar: "ممثل", en: "Actor" }, { value: "model", ar: "مودل", en: "Model" }];
const COUNTRY_OPTIONS = [
  { value: "SA", ar: "السعودية", en: "Saudi Arabia", enabled: true },
  { value: "AE", ar: "الإمارات", en: "United Arab Emirates", enabled: false },
  { value: "QA", ar: "قطر", en: "Qatar", enabled: false },
] as const;
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

function sameArray(a: string[], b: string[]) { return JSON.stringify(a) === JSON.stringify(b); }
function toNumber(value: string) { return value.trim() ? Number(value) : null; }
function countryLabel(code: string | null, locale: "ar" | "en") { return COUNTRY_OPTIONS.find((item) => item.value === code)?.[locale] ?? ""; }
function formatDate(value: string, locale: "ar" | "en") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return locale === "ar" ? "اختر تاريخ الميلاد" : "Choose date of birth";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return locale === "ar" ? "اختر تاريخ الميلاد" : "Choose date of birth";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export default function EditTalentProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const align = isRtl ? "right" : "left";
  const insets = useSafeAreaInsets();

  const [initial, setInitial] = useState<MobileTalentProfile | null>(null);
  const [primaryRole, setPrimaryRole] = useState<"actor" | "model" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [dialects, setDialects] = useState("");
  const [modelingTypes, setModelingTypes] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>("SA");
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalitySlug, setNationalitySlug] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<CanonicalMobileOption[]>(SAUDI_CITY_OPTIONS);
  const [nationalityOptions, setNationalityOptions] = useState<CanonicalMobileOption[]>([]);
  const [heightCm, setHeightCm] = useState(""); const [weightKg, setWeightKg] = useState(""); const [shoeSize, setShoeSize] = useState("");
  const [eyeColor, setEyeColor] = useState<string | null>(null); const [hairColor, setHairColor] = useState<string | null>(null); const [hairType, setHairType] = useState<string | null>(null); const [skinColor, setSkinColor] = useState<string | null>(null); const [clothingSize, setClothingSize] = useState<string | null>(null);
  const [actingAgeMin, setActingAgeMin] = useState(""); const [actingAgeMax, setActingAgeMax] = useState(""); const [experienceYears, setExperienceYears] = useState("");
  const [readyToTravel, setReadyToTravel] = useState(false); const [hasPassport, setHasPassport] = useState(false); const [hasCar, setHasCar] = useState(false); const [workOutsideCity, setWorkOutsideCity] = useState(false); const [workOutsideCountry, setWorkOutsideCountry] = useState(false);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"city" | "nationality" | "skills" | "languages" | "modeling" | "dob" | null>(null);

  useEffect(() => { let active = true; void (async () => { try {
    const [result, canonical] = await Promise.all([getTalentProfile(locale), getCanonicalProfileOptions()]);
    if (!active) return;
    if (canonical) { setCityOptions(canonical.cities); setNationalityOptions(canonical.nationalities); }
    if (!result.ok) { if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } }); else setError(isArabic ? "تعذر تحميل بيانات الملف." : "Unable to load profile details."); return; }
    const i = result.item;
    setInitial(i); setPrimaryRole(i.primaryRole); setDisplayName(i.displayName); setBio(i.bio ?? ""); setSkills(i.skills); setLanguages(i.languages); setDialects(i.dialects.join(", ")); setModelingTypes(i.modelingTypes); setCountryCode(i.baseCountryCode ?? "SA"); setCitySlug(i.citySlug); setGender(i.gender); setDateOfBirth(i.dateOfBirth ?? ""); setNationalitySlug(i.nationalitySlug); setAvailabilityStatus(i.availabilityStatus); setHeightCm(i.heightCm == null ? "" : String(i.heightCm)); setWeightKg(i.weightKg == null ? "" : String(i.weightKg)); setShoeSize(i.shoeSize == null ? "" : String(i.shoeSize)); setEyeColor(i.eyeColor); setHairColor(i.hairColor); setHairType(i.hairType); setSkinColor(i.skinColor); setClothingSize(i.clothingSize); setActingAgeMin(i.actingAgeMin == null ? "" : String(i.actingAgeMin)); setActingAgeMax(i.actingAgeMax == null ? "" : String(i.actingAgeMax)); setExperienceYears(i.experienceYears == null ? "" : String(i.experienceYears)); setReadyToTravel(i.readyToTravel); setHasPassport(i.hasPassport); setHasCar(i.hasCar); setWorkOutsideCity(i.workOutsideCity); setWorkOutsideCountry(i.workOutsideCountry);
  } catch { if (active) setError(isArabic ? "تعذر تحميل بيانات الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile details. Check your connection and try again."); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [isArabic, locale]);

  async function save() {
    if (saving || !initial) return;
    setError(null); setSuccess(null);
    const height = toNumber(heightCm), weight = toNumber(weightKg), shoe = toNumber(shoeSize), ageMin = toNumber(actingAgeMin), ageMax = toNumber(actingAgeMax), experience = toNumber(experienceYears);
    if (displayName.trim().length > 80) return setError(isArabic ? "الاسم المهني يجب ألا يتجاوز 80 حرفًا." : "Professional name must be 80 characters or fewer.");
    if (bio.trim().length > 1200) return setError(isArabic ? "النبذة طويلة جدًا." : "Bio is too long.");
    if (height !== null && (!Number.isFinite(height) || height < 80 || height > 250)) return setError(isArabic ? "تحقق من الطول المدخل." : "Check the height value.");
    if (ageMin !== null && ageMax !== null && ageMin > ageMax) return setError(isArabic ? "العمر التمثيلي الأدنى لا يمكن أن يتجاوز الأعلى." : "Acting age minimum cannot exceed maximum.");

    const input: MobileTalentProfileUpdateInput = {};
    const dialectsArray = dialects.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
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
    if (nationalitySlug !== initial.nationalitySlug && nationalitySlug !== null) input.nationalitySlug = nationalitySlug;
    if (availabilityStatus !== initial.availabilityStatus) input.availabilityStatus = availabilityStatus;
    if (height !== initial.heightCm) input.heightCm = height; if (weight !== initial.weightKg) input.weightKg = weight; if (shoe !== initial.shoeSize) input.shoeSize = shoe;
    if (eyeColor !== initial.eyeColor) input.eyeColor = eyeColor; if (hairColor !== initial.hairColor) input.hairColor = hairColor; if (hairType !== initial.hairType) input.hairType = hairType; if (skinColor !== initial.skinColor) input.skinColor = skinColor; if (clothingSize !== initial.clothingSize) input.clothingSize = clothingSize;
    if (ageMin !== initial.actingAgeMin) input.actingAgeMin = ageMin; if (ageMax !== initial.actingAgeMax) input.actingAgeMax = ageMax; if (experience !== initial.experienceYears) input.experienceYears = experience;
    if (readyToTravel !== initial.readyToTravel) input.readyToTravel = readyToTravel; if (hasPassport !== initial.hasPassport) input.hasPassport = hasPassport; if (hasCar !== initial.hasCar) input.hasCar = hasCar; if (workOutsideCity !== initial.workOutsideCity) input.workOutsideCity = workOutsideCity; if (workOutsideCountry !== initial.workOutsideCountry) input.workOutsideCountry = workOutsideCountry;
    if (!Object.keys(input).length) { setSuccess(isArabic ? "لا توجد تغييرات للحفظ." : "No changes to save."); return; }
    setSaving(true);
    try { const result = await updateTalentProfile(locale, input); if (!result.ok) { setError(isArabic ? "تعذر حفظ التعديلات. راجع الحقل الذي غيرته وحاول مرة أخرى." : "Unable to save changes. Check the field you changed and try again."); return; } setSuccess(isArabic ? "تم حفظ التغييرات." : "Changes saved."); setTimeout(() => router.replace("/profile"), 450); }
    catch { setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل محرر الملف" : "Loading profile editor"} />;
  const nationalityLabel = nationalityOptions.find((o) => o.value === nationalitySlug)?.[locale] ?? (isArabic ? "اختر الجنسية" : "Choose nationality");
  const cityLabel = cityOptions.find((o) => o.value === citySlug)?.[locale] ?? (isArabic ? "اختر المدينة" : "Choose city");

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr", paddingTop: Math.max(insets.top + 6, 18) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}><Pressable onPress={() => router.back()} hitSlop={8}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
      <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text>
      <Text style={[styles.subtitle, { textAlign: align }]}>{isArabic ? "عدّل القسم الذي تحتاجه فقط. الحفظ لا يتطلب إكمال بقية الملف." : "Edit only the section you need. Saving does not require completing the rest of your profile."}</Text>

      <Section title={isArabic ? "البيانات الأساسية" : "Core details"} styles={styles} defaultOpen>
        <Label text={isArabic ? "نوع الموهبة" : "Talent type"} styles={styles}/><OptionWrap options={TALENT_ROLE_OPTIONS} value={primaryRole} onChange={(v) => setPrimaryRole(v as "actor" | "model")} locale={locale} styles={styles}/>
        <Field label={isArabic ? "الاسم المهني" : "Professional name"} value={displayName} onChangeText={setDisplayName} styles={styles} align={align}/>
        <Label text={isArabic ? "الدولة" : "Country"} styles={styles}/><OptionWrap options={COUNTRY_OPTIONS.map((o) => ({ value: o.value, ar: o.ar, en: o.en }))} value={countryCode} onChange={(v) => { if (v === "SA") setCountryCode(v); }} locale={locale} styles={styles}/>
        <SheetField label={isArabic ? "المدينة" : "City"} value={cityLabel} disabled={countryCode !== "SA"} onPress={() => setSheet("city")} styles={styles}/>
        <Label text={isArabic ? "الجنس" : "Gender"} styles={styles}/><OptionWrap options={TALENT_GENDER_OPTIONS} value={gender} onChange={setGender} locale={locale} styles={styles}/>
        <SheetField label={isArabic ? "تاريخ الميلاد" : "Date of birth"} value={formatDate(dateOfBirth, locale)} icon={<CalendarDays size={19} color={theme.accent}/>} onPress={() => setSheet("dob")} styles={styles}/>
        <SheetField label={isArabic ? "الجنسية" : "Nationality"} value={nationalityLabel} onPress={() => setSheet("nationality")} styles={styles}/>
        <Label text={isArabic ? "حالة التوفر" : "Availability"} styles={styles}/><OptionWrap options={TALENT_AVAILABILITY_OPTIONS} value={availabilityStatus} onChange={setAvailabilityStatus} locale={locale} styles={styles}/>
      </Section>

      <Section title={isArabic ? "المقاسات والمظهر" : "Measurements & appearance"} styles={styles}>
        <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "الطول سم" : "Height cm"} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" styles={styles} align={align}/></View><View style={styles.col}><Field label={isArabic ? "الوزن كجم" : "Weight kg"} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" styles={styles} align={align}/></View></View>
        <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "مقاس الحذاء" : "Shoe size"} value={shoeSize} onChangeText={setShoeSize} keyboardType="numeric" styles={styles} align={align}/></View><View style={styles.col}><Label text={isArabic ? "مقاس الملابس" : "Clothing size"} styles={styles}/><OptionWrap options={CLOTHING_SIZE_OPTIONS} value={clothingSize} onChange={setClothingSize} locale={locale} styles={styles} compact/></View></View>
        <Label text={isArabic ? "لون العين" : "Eye color"} styles={styles}/><OptionWrap options={EYE_COLOR_OPTIONS} value={eyeColor} onChange={setEyeColor} locale={locale} styles={styles} compact/>
        <Label text={isArabic ? "لون الشعر" : "Hair color"} styles={styles}/><OptionWrap options={HAIR_COLOR_OPTIONS} value={hairColor} onChange={setHairColor} locale={locale} styles={styles} compact/>
        <Label text={isArabic ? "نوع الشعر" : "Hair type"} styles={styles}/><OptionWrap options={HAIR_TYPE_OPTIONS} value={hairType} onChange={setHairType} locale={locale} styles={styles} compact/>
        <Label text={isArabic ? "لون البشرة" : "Skin tone"} styles={styles}/><OptionWrap options={SKIN_COLOR_OPTIONS} value={skinColor} onChange={setSkinColor} locale={locale} styles={styles} compact/>
      </Section>

      <Section title={isArabic ? "الخبرة والمهارات" : "Experience & skills"} styles={styles}>
        <Field label={isArabic ? "نبذة" : "Bio"} value={bio} onChangeText={setBio} multiline maxLength={1200} styles={styles} align={align}/>
        <SheetField label={isArabic ? "المهارات" : "Skills"} value={skills.length ? skills.join(" · ") : (isArabic ? "اختر المهارات" : "Choose skills")} onPress={() => setSheet("skills")} styles={styles}/>
        <SheetField label={isArabic ? "اللغات" : "Languages"} value={languages.length ? languages.join(" · ") : (isArabic ? "اختر اللغات" : "Choose languages")} onPress={() => setSheet("languages")} styles={styles}/>
        {primaryRole === "actor" ? <><Field label={isArabic ? "اللهجات" : "Dialects"} value={dialects} onChangeText={setDialects} styles={styles} align={align}/><View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "العمر التمثيلي من" : "Acting age min"} value={actingAgeMin} onChangeText={setActingAgeMin} keyboardType="number-pad" styles={styles} align={align}/></View><View style={styles.col}><Field label={isArabic ? "إلى" : "Max"} value={actingAgeMax} onChangeText={setActingAgeMax} keyboardType="number-pad" styles={styles} align={align}/></View></View></> : <SheetField label={isArabic ? "أنواع المودل" : "Modeling types"} value={modelingTypes.length ? modelingTypes.join(" · ") : (isArabic ? "اختر أنواع المودل" : "Choose modeling types")} onPress={() => setSheet("modeling")} styles={styles}/>} 
        <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"} value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" styles={styles} align={align}/>
      </Section>

      <Section title={isArabic ? "التنقل والجاهزية" : "Mobility & readiness"} styles={styles}><Toggle label={isArabic ? "جاهز للسفر" : "Ready to travel"} value={readyToTravel} onChange={setReadyToTravel} styles={styles}/><Toggle label={isArabic ? "لديه جواز" : "Has passport"} value={hasPassport} onChange={setHasPassport} styles={styles}/><Toggle label={isArabic ? "لديه سيارة" : "Has car"} value={hasCar} onChange={setHasCar} styles={styles}/><Toggle label={isArabic ? "العمل خارج المدينة" : "Work outside city"} value={workOutsideCity} onChange={setWorkOutsideCity} styles={styles}/><Toggle label={isArabic ? "العمل خارج الدولة" : "Work outside country"} value={workOutsideCountry} onChange={setWorkOutsideCountry} styles={styles}/></Section>
      {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}{success ? <View style={styles.successBox}><Text style={styles.success}>{success}</Text></View> : null}
      <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color={theme.background}/> : <Text style={styles.saveText}>{isArabic ? "حفظ التغييرات" : "Save changes"}</Text>}</Pressable>
      <Pressable onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={styles.reviewText}>{isArabic ? "مراجعة الجاهزية" : "Review readiness"}</Text></Pressable>
    </ScrollView>

    <SingleSelectSheet visible={sheet === "city"} title={isArabic ? "اختر المدينة" : "Choose city"} searchPlaceholder={isArabic ? "ابحث عن مدينة" : "Search city"} options={cityOptions} value={citySlug} locale={locale} onClose={() => setSheet(null)} onSelect={(v) => { setCitySlug(v); setSheet(null); }} styles={styles}/>
    <SingleSelectSheet visible={sheet === "nationality"} title={isArabic ? "اختر الجنسية" : "Choose nationality"} searchPlaceholder={isArabic ? "ابحث عن جنسية" : "Search nationality"} options={nationalityOptions} value={nationalitySlug} locale={locale} onClose={() => setSheet(null)} onSelect={(v) => { setNationalitySlug(v); setSheet(null); }} styles={styles}/>
    <MultiSelectSheet visible={sheet === "skills"} title={isArabic ? "المهارات" : "Skills"} options={SKILL_OPTIONS} values={skills} locale={locale} max={12} onClose={() => setSheet(null)} onChange={setSkills} styles={styles}/>
    <MultiSelectSheet visible={sheet === "languages"} title={isArabic ? "اللغات" : "Languages"} options={LANGUAGE_OPTIONS} values={languages} locale={locale} max={8} onClose={() => setSheet(null)} onChange={setLanguages} styles={styles}/>
    <MultiSelectSheet visible={sheet === "modeling"} title={isArabic ? "أنواع المودل" : "Modeling types"} options={MODELING_TYPE_OPTIONS} values={modelingTypes} locale={locale} max={8} onClose={() => setSheet(null)} onChange={setModelingTypes} styles={styles}/>
    <DateSheet visible={sheet === "dob"} value={dateOfBirth} locale={locale} onClose={() => setSheet(null)} onChange={setDateOfBirth} styles={styles}/>
  </KeyboardAvoidingView>;
}

function Section({ title, children, styles, defaultOpen = false }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; defaultOpen?: boolean }) { const [open, setOpen] = useState(defaultOpen); return <View style={[styles.section, open && styles.sectionOpen]}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionChevron}>{open ? "−" : "+"}</Text></Pressable>{open ? <View style={styles.sectionBody}>{children}</View> : null}</View>; }
function Label({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) { return <Text style={styles.label}>{text}</Text>; }
function Field({ label, styles, align, ...props }: { label: string; styles: ReturnType<typeof createStyles>; align: "left" | "right" } & React.ComponentProps<typeof TextInput>) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#8F8F89" style={[styles.input, { textAlign: align }, props.multiline && styles.multiline]} {...props}/></View>; }
function OptionWrap({ options, value, onChange, locale, styles, compact }: { options: (MobileOption | CanonicalMobileOption)[]; value: string | null; onChange: (v: string | null) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <View style={styles.options}>{options.map((o) => <Pressable key={o.value} style={[styles.option, compact && styles.optionCompact, value === o.value && styles.optionActive]} onPress={() => onChange(value === o.value ? null : o.value)}><Text style={[styles.optionText, value === o.value && styles.optionTextActive]}>{o[locale]}</Text></Pressable>)}</View>; }
function SheetField({ label, value, onPress, disabled, icon, styles }: { label: string; value: string; onPress: () => void; disabled?: boolean; icon?: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><Pressable disabled={disabled} onPress={onPress} style={[styles.selector, disabled && styles.disabled]}>{icon}<Text numberOfLines={2} style={styles.selectorText}>{value}</Text><ChevronDown size={18} color="#C9A962"/></Pressable></View>; }
function Toggle({ label, value, onChange, styles }: { label: string; value: boolean; onChange: (v: boolean) => void; styles: ReturnType<typeof createStyles> }) { return <View style={styles.toggleRow}><Text style={styles.toggleLabel}>{label}</Text><Switch value={value} onValueChange={onChange}/></View>; }

function SheetShell({ visible, title, children, onClose, styles }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void; styles: ReturnType<typeof createStyles> }) { const insets = useSafeAreaInsets(); return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose}/><View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}><View style={styles.sheetHandle}/><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><Pressable onPress={onClose} style={styles.sheetClose}><X size={20} color="#F5F5F0"/></Pressable></View>{children}</View></View></Modal>; }
function SingleSelectSheet({ visible, title, searchPlaceholder, options, value, locale, onClose, onSelect, styles }: { visible: boolean; title: string; searchPlaceholder: string; options: CanonicalMobileOption[]; value: string | null; locale: "ar" | "en"; onClose: () => void; onSelect: (v: string) => void; styles: ReturnType<typeof createStyles> }) { const [query, setQuery] = useState(""); const filtered = options.filter((o) => !query.trim() || `${o.ar} ${o.en}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 60); return <SheetShell visible={visible} title={title} onClose={() => { setQuery(""); onClose(); }} styles={styles}><View style={styles.sheetSearch}><Search size={18} color="#8F8F89"/><TextInput value={query} onChangeText={setQuery} placeholder={searchPlaceholder} placeholderTextColor="#8F8F89" style={styles.sheetSearchInput}/></View><ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">{filtered.map((o) => <Pressable key={o.value} onPress={() => { setQuery(""); onSelect(o.value); }} style={styles.sheetRow}><Text style={styles.sheetRowText}>{o[locale]}</Text>{value === o.value ? <Check size={19} color="#C9A962"/> : null}</Pressable>)}</ScrollView></SheetShell>; }
function MultiSelectSheet({ visible, title, options, values, locale, max, onClose, onChange, styles }: { visible: boolean; title: string; options: MobileOption[]; values: string[]; locale: "ar" | "en"; max: number; onClose: () => void; onChange: (v: string[]) => void; styles: ReturnType<typeof createStyles> }) { function toggle(v: string) { if (values.includes(v)) onChange(values.filter((x) => x !== v)); else if (values.length < max) onChange([...values, v]); } return <SheetShell visible={visible} title={title} onClose={onClose} styles={styles}><View style={styles.multiGrid}>{options.map((o) => { const active = values.includes(o.value); return <Pressable key={o.value} onPress={() => toggle(o.value)} style={[styles.multiChip, active && styles.multiChipActive]}><Text style={[styles.multiChipText, active && styles.multiChipTextActive]}>{o[locale]}</Text>{active ? <Check size={16} color="#050505"/> : null}</Pressable>; })}</View><Pressable onPress={onClose} style={styles.sheetDone}><Text style={styles.sheetDoneText}>{locale === "ar" ? "تم" : "Done"}</Text></Pressable></SheetShell>; }
function DateSheet({ visible, value, locale, onClose, onChange, styles }: { visible: boolean; value: string; locale: "ar" | "en"; onClose: () => void; onChange: (v: string) => void; styles: ReturnType<typeof createStyles> }) { const candidate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(2000, 0, 1); return <SheetShell visible={visible} title={locale === "ar" ? "تاريخ الميلاد" : "Date of birth"} onClose={onClose} styles={styles}><DateTimePicker value={candidate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} maximumDate={new Date()} minimumDate={new Date(1920, 0, 1)} locale={locale === "ar" ? "ar-SA" : "en-US"} onChange={(event, next) => { if (event.type === "dismissed") { onClose(); return; } if (next) onChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`); if (Platform.OS !== "ios") onClose(); }}/>{Platform.OS === "ios" ? <Pressable onPress={onClose} style={styles.sheetDone}><Text style={styles.sheetDoneText}>{locale === "ar" ? "تم" : "Done"}</Text></Pressable> : null}</SheetShell>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 60, gap: 16 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: theme.text, fontSize: 15, fontWeight: "700" }, brand: { color: theme.accent, fontWeight: "900", fontSize: 18, letterSpacing: 1.5 }, title: { color: theme.text, fontSize: 31, lineHeight: 37, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 21 },
  section: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface, overflow: "hidden" }, sectionOpen: { borderColor: "#C9A96255" }, sectionHeader: { minHeight: 60, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, sectionTitle: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "900" }, sectionChevron: { color: theme.accent, fontSize: 24, fontWeight: "500" }, sectionBody: { gap: 14, paddingHorizontal: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }, label: { color: theme.text, fontSize: 14, fontWeight: "800" }, fieldWrap: { gap: 8 }, input: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 14, color: theme.text, fontSize: 16, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: theme.surface }, multiline: { minHeight: 110, textAlignVertical: "top" }, options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, option: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, optionCompact: { minHeight: 40, paddingHorizontal: 13 }, optionActive: { borderColor: theme.accent, backgroundColor: "#C9A96218" }, optionText: { color: theme.muted, fontWeight: "700" }, optionTextActive: { color: theme.text },
  selector: { minHeight: 54, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: theme.surface }, selectorText: { flex: 1, color: theme.text, fontSize: 16 }, twoCol: { flexDirection: "row", gap: 10 }, col: { flex: 1 }, toggleRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: theme.border }, toggleLabel: { color: theme.text, fontSize: 15 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F12", borderRadius: 14, padding: 14 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, successBox: { borderWidth: 1, borderColor: "#C9A96266", backgroundColor: "#C9A96210", borderRadius: 14, padding: 14 }, success: { color: theme.accent, fontSize: 13 }, saveButton: { minHeight: 56, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, saveText: { color: theme.background, fontSize: 17, fontWeight: "900" }, reviewButton: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, reviewText: { color: theme.text, fontSize: 16, fontWeight: "800" }, disabled: { opacity: .45 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000099" }, sheet: { maxHeight: "72%", backgroundColor: "#101010", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: "#FFFFFF18", paddingHorizontal: 18, paddingTop: 8 }, sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF33", marginBottom: 10 }, sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, marginBottom: 8 }, sheetTitle: { color: theme.text, fontSize: 20, fontWeight: "900" }, sheetClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF0F", alignItems: "center", justifyContent: "center" }, sheetSearch: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 48, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 13, marginBottom: 10 }, sheetSearchInput: { flex: 1, color: theme.text, fontSize: 15 }, sheetList: { maxHeight: 390 }, sheetRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 4 }, sheetRowText: { color: theme.text, fontSize: 16 }, multiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 8 }, multiChip: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: theme.border }, multiChipActive: { backgroundColor: theme.accent, borderColor: theme.accent }, multiChipText: { color: theme.text, fontWeight: "700" }, multiChipTextActive: { color: theme.background }, sheetDone: { minHeight: 54, backgroundColor: theme.accent, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 16 }, sheetDoneText: { color: theme.background, fontSize: 16, fontWeight: "900" },
}); }
