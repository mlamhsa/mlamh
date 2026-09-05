import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getTalentProfile, updateTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getCanonicalProfileOptions, type CanonicalMobileOption } from "@/lib/profile-options-api";
import { CLOTHING_SIZE_OPTIONS, EYE_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_TYPE_OPTIONS, SAUDI_CITY_OPTIONS, SKIN_COLOR_OPTIONS, TALENT_AVAILABILITY_OPTIONS, TALENT_GENDER_OPTIONS, type MobileOption } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

const TALENT_ROLE_OPTIONS: MobileOption[] = [
  { value: "actor", ar: "ممثل", en: "Actor" },
  { value: "model", ar: "مودل", en: "Model" },
];

export default function EditTalentProfileScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [primaryRole, setPrimaryRole] = useState<"actor" | "model" | null>(null);
  const [displayName, setDisplayName] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState(""); const [languages, setLanguages] = useState(""); const [dialects, setDialects] = useState(""); const [modelingTypes, setModelingTypes] = useState("");
  const [citySlug, setCitySlug] = useState<string | null>(null); const [gender, setGender] = useState<string | null>(null); const [dateOfBirth, setDateOfBirth] = useState(""); const [nationalitySlug, setNationalitySlug] = useState<string | null>(null); const [nationalityQuery, setNationalityQuery] = useState(""); const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<CanonicalMobileOption[]>(SAUDI_CITY_OPTIONS); const [nationalityOptions, setNationalityOptions] = useState<CanonicalMobileOption[]>([]);
  const [heightCm, setHeightCm] = useState(""); const [weightKg, setWeightKg] = useState(""); const [shoeSize, setShoeSize] = useState(""); const [eyeColor, setEyeColor] = useState<string | null>(null); const [hairColor, setHairColor] = useState<string | null>(null); const [hairType, setHairType] = useState<string | null>(null); const [skinColor, setSkinColor] = useState<string | null>(null); const [clothingSize, setClothingSize] = useState<string | null>(null);
  const [actingAgeMin, setActingAgeMin] = useState(""); const [actingAgeMax, setActingAgeMax] = useState(""); const [experienceYears, setExperienceYears] = useState("");
  const [readyToTravel, setReadyToTravel] = useState(false); const [hasPassport, setHasPassport] = useState(false); const [hasCar, setHasCar] = useState(false); const [workOutsideCity, setWorkOutsideCity] = useState(false); const [workOutsideCountry, setWorkOutsideCountry] = useState(false);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [result, canonicalOptions] = await Promise.all([getTalentProfile(locale), getCanonicalProfileOptions()]);
        if (!active) return;
        if (canonicalOptions) {
          setCityOptions(canonicalOptions.cities);
          setNationalityOptions(canonicalOptions.nationalities);
        }
        if (!result.ok) { if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } }); else setError(isArabic ? "تعذر تحميل بيانات الملف." : "Unable to load profile details."); return; }
        const i = result.item;
        setPrimaryRole(i.primaryRole); setDisplayName(i.displayName); setBio(i.bio ?? ""); setSkills(i.skills.join(", ")); setLanguages(i.languages.join(", ")); setDialects(i.dialects.join(", ")); setModelingTypes(i.modelingTypes.join(", "));
        setCitySlug(i.citySlug); setGender(i.gender); setDateOfBirth(i.dateOfBirth ?? ""); setNationalitySlug(i.nationalitySlug); setNationalityQuery(i.nationality ?? i.nationalitySlug ?? ""); setAvailabilityStatus(i.availabilityStatus);
        setHeightCm(i.heightCm == null ? "" : String(i.heightCm)); setWeightKg(i.weightKg == null ? "" : String(i.weightKg)); setShoeSize(i.shoeSize == null ? "" : String(i.shoeSize)); setEyeColor(i.eyeColor); setHairColor(i.hairColor); setHairType(i.hairType); setSkinColor(i.skinColor); setClothingSize(i.clothingSize);
        setActingAgeMin(i.actingAgeMin == null ? "" : String(i.actingAgeMin)); setActingAgeMax(i.actingAgeMax == null ? "" : String(i.actingAgeMax)); setExperienceYears(i.experienceYears == null ? "" : String(i.experienceYears));
        setReadyToTravel(i.readyToTravel); setHasPassport(i.hasPassport); setHasCar(i.hasCar); setWorkOutsideCity(i.workOutsideCity); setWorkOutsideCountry(i.workOutsideCountry);
      } catch { if (active) setError(isArabic ? "تعذر تحميل بيانات الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile details. Check your connection and try again."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [isArabic, locale]);

  async function save() {
    if (saving) return;
    const split = (value: string, max = 12) => value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, max);
    const number = (value: string) => value.trim() ? Number(value) : null;
    const height = number(heightCm), weight = number(weightKg), shoe = number(shoeSize), ageMin = number(actingAgeMin), ageMax = number(actingAgeMax), experience = number(experienceYears);
    if (!primaryRole || !nationalitySlug || displayName.trim().length > 80 || bio.trim().length > 1200 || split(skills).some((x) => x.length > 40) || (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) || (height !== null && (!Number.isFinite(height) || height < 80 || height > 250)) || (ageMin !== null && ageMax !== null && ageMin > ageMax)) {
      setError(isArabic ? "راجع البيانات المدخلة، واختر الجنسية من القائمة، وتأكد من نوع الموهبة وتاريخ الميلاد والطول والعمر التمثيلي." : "Review your entries, choose nationality from the list, and verify talent type, date of birth, height, and acting age."); return;
    }
    setSaving(true); setError(null);
    try {
      const result = await updateTalentProfile(locale, {
        primaryRole, displayName, bio, skills: split(skills), languages: split(languages, 8), dialects: split(dialects, 8), modelingTypes: split(modelingTypes, 8), citySlug, gender,
        dateOfBirth: dateOfBirth || null, nationalitySlug, heightCm: height, weightKg: weight, shoeSize: shoe, availabilityStatus, eyeColor, hairColor, hairType, skinColor, clothingSize,
        actingAgeMin: ageMin, actingAgeMax: ageMax, experienceYears: experience, readyToTravel, hasPassport, hasCar, workOutsideCity, workOutsideCountry,
      });
      if (!result.ok) { setError(isArabic ? "تعذر حفظ التعديلات. راجع البيانات وحاول مرة أخرى." : "Unable to save changes. Review the details and try again."); return; }
      router.replace("/profile");
    } catch { setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  const align = isRtl ? "right" : "left";
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
    <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
    <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { textAlign: align }]}>{isArabic ? "بيانات ملفك" : "Profile details"}</Text><Text style={[styles.subtitle, { textAlign: align }]}>{isArabic ? "ملف مهني كامل يساعد على المطابقة ويجهزك للمراجعة." : "A complete professional profile improves matching and review readiness."}</Text></View>

    <Section title={isArabic ? "البيانات الأساسية" : "Core details"} styles={styles}>
      <Label text={isArabic ? "نوع الموهبة" : "Talent type"} styles={styles} /><OptionWrap options={TALENT_ROLE_OPTIONS} value={primaryRole} onChange={(value) => setPrimaryRole(value as "actor" | "model")} locale={locale} styles={styles} />
      <Field label={isArabic ? "الاسم المهني" : "Professional name"} value={displayName} onChangeText={setDisplayName} styles={styles} align={align} />
      <Label text={isArabic ? "المدينة" : "City"} styles={styles} /><OptionWrap options={cityOptions} value={citySlug} onChange={setCitySlug} locale={locale} styles={styles} />
      <Label text={isArabic ? "الجنس" : "Gender"} styles={styles} /><OptionWrap options={TALENT_GENDER_OPTIONS} value={gender} onChange={setGender} locale={locale} styles={styles} />
      <Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" styles={styles} align={align} />
      <SearchOptionField label={isArabic ? "الجنسية" : "Nationality"} query={nationalityQuery} setQuery={(value) => { setNationalityQuery(value); setNationalitySlug(null); }} value={nationalitySlug} options={nationalityOptions} onSelect={(option) => { setNationalitySlug(option.value); setNationalityQuery(locale === "ar" ? option.ar : option.en); }} locale={locale} styles={styles} align={align} />
      <Label text={isArabic ? "حالة التوفر" : "Availability"} styles={styles} /><OptionWrap options={TALENT_AVAILABILITY_OPTIONS} value={availabilityStatus} onChange={setAvailabilityStatus} locale={locale} styles={styles} />
    </Section>

    <Section title={isArabic ? "المقاسات والمظهر" : "Measurements & appearance"} styles={styles}>
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "الطول سم" : "Height cm"} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" styles={styles} align={align} /></View><View style={styles.col}><Field label={isArabic ? "الوزن كجم" : "Weight kg"} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" styles={styles} align={align} /></View></View>
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "مقاس الحذاء" : "Shoe size"} value={shoeSize} onChangeText={setShoeSize} keyboardType="numeric" styles={styles} align={align} /></View><View style={styles.col}><Label text={isArabic ? "مقاس الملابس" : "Clothing size"} styles={styles} /><OptionWrap options={CLOTHING_SIZE_OPTIONS} value={clothingSize} onChange={setClothingSize} locale={locale} styles={styles} compact /></View></View>
      <Label text={isArabic ? "لون العين" : "Eye color"} styles={styles} /><OptionWrap options={EYE_COLOR_OPTIONS} value={eyeColor} onChange={setEyeColor} locale={locale} styles={styles} compact />
      <Label text={isArabic ? "لون الشعر" : "Hair color"} styles={styles} /><OptionWrap options={HAIR_COLOR_OPTIONS} value={hairColor} onChange={setHairColor} locale={locale} styles={styles} compact />
      <Label text={isArabic ? "نوع الشعر" : "Hair type"} styles={styles} /><OptionWrap options={HAIR_TYPE_OPTIONS} value={hairType} onChange={setHairType} locale={locale} styles={styles} compact />
      <Label text={isArabic ? "لون البشرة" : "Skin tone"} styles={styles} /><OptionWrap options={SKIN_COLOR_OPTIONS} value={skinColor} onChange={setSkinColor} locale={locale} styles={styles} compact />
    </Section>

    <Section title={isArabic ? "الخبرة والمهارات" : "Experience & skills"} styles={styles}>
      <Field label={isArabic ? "نبذة" : "Bio"} value={bio} onChangeText={setBio} multiline maxLength={1200} styles={styles} align={align} /><Text style={styles.counter}>{bio.length}/1200</Text>
      <Field label={isArabic ? "المهارات — افصل بفاصلة" : "Skills — comma separated"} value={skills} onChangeText={setSkills} multiline styles={styles} align={align} />
      <Field label={isArabic ? "اللغات — افصل بفاصلة" : "Languages — comma separated"} value={languages} onChangeText={setLanguages} styles={styles} align={align} />
      {primaryRole === "actor" ? <><Field label={isArabic ? "اللهجات — افصل بفاصلة" : "Dialects — comma separated"} value={dialects} onChangeText={setDialects} styles={styles} align={align} /><View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "العمر التمثيلي من" : "Acting age min"} value={actingAgeMin} onChangeText={setActingAgeMin} keyboardType="number-pad" styles={styles} align={align} /></View><View style={styles.col}><Field label={isArabic ? "إلى" : "Max"} value={actingAgeMax} onChangeText={setActingAgeMax} keyboardType="number-pad" styles={styles} align={align} /></View></View></> : null}
      {primaryRole === "model" ? <Field label={isArabic ? "أنواع أعمال المودل — افصل بفاصلة" : "Modeling types — comma separated"} value={modelingTypes} onChangeText={setModelingTypes} styles={styles} align={align} /> : null}
      <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"} value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" styles={styles} align={align} />
    </Section>

    <Section title={isArabic ? "التنقل والاستعداد" : "Mobility & readiness"} styles={styles}>
      <Toggle label={isArabic ? "مستعد للسفر" : "Ready to travel"} value={readyToTravel} onChange={setReadyToTravel} styles={styles} /><Toggle label={isArabic ? "لدي جواز سفر" : "Has passport"} value={hasPassport} onChange={setHasPassport} styles={styles} /><Toggle label={isArabic ? "لدي سيارة" : "Has car"} value={hasCar} onChange={setHasCar} styles={styles} /><Toggle label={isArabic ? "أعمل خارج مدينتي" : "Work outside city"} value={workOutsideCity} onChange={setWorkOutsideCity} styles={styles} /><Toggle label={isArabic ? "أعمل خارج الدولة" : "Work outside country"} value={workOutsideCountry} onChange={setWorkOutsideCountry} styles={styles} />
    </Section>

    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
    <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, saving && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color={theme.background} /> : <Text style={styles.saveText}>{isArabic ? "حفظ التعديلات" : "Save changes"}</Text>}</Pressable>
    <Pressable disabled={saving} onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={styles.reviewText}>{isArabic ? "مراجعة الجاهزية" : "Review readiness"}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Label({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) { return <Text style={styles.label}>{text}</Text>; }
function Field({ label, styles, multiline, align, ...props }: { label: string; styles: ReturnType<typeof createStyles>; multiline?: boolean; align: "left" | "right" } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Label text={label} styles={styles} /><TextInput {...props} multiline={multiline} textAlign={align} textAlignVertical={multiline ? "top" : "center"} placeholderTextColor={styles.placeholder.color} style={[styles.input, multiline && styles.multiline]} /></View>; }
function OptionWrap({ options, value, onChange, locale, styles, compact = false }: { options: Array<MobileOption | CanonicalMobileOption>; value: string | null; onChange: (value: string) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <View style={styles.options}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.option, compact && styles.optionCompact, value === option.value && styles.optionActive]}><Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>{locale === "ar" ? option.ar : option.en}</Text></Pressable>)}</View>; }
function SearchOptionField({ label, query, setQuery, value, options, onSelect, locale, styles, align }: { label: string; query: string; setQuery: (value: string) => void; value: string | null; options: CanonicalMobileOption[]; onSelect: (option: CanonicalMobileOption) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; align: "left" | "right" }) {
  const normalized = query.trim().toLowerCase();
  const visible = normalized && !value ? options.filter((option) => [option.ar, option.en, option.code ?? "", option.value].some((candidate) => candidate.toLowerCase().includes(normalized))).slice(0, 6) : [];
  return <View style={styles.field}><Label text={label} styles={styles} /><TextInput value={query} onChangeText={setQuery} placeholder={locale === "ar" ? "ابحث بالجنسية أو الدولة" : "Search nationality or country"} placeholderTextColor={styles.placeholder.color} style={styles.input} textAlign={align} autoCorrect={false} />{visible.length ? <View style={styles.suggestionList}>{visible.map((option) => <Pressable key={option.value} onPress={() => onSelect(option)} style={styles.suggestion}><Text style={styles.suggestionText}>{locale === "ar" ? option.ar : option.en}</Text><Text style={styles.suggestionCode}>{option.code}</Text></Pressable>)}</View> : null}{query && !value && normalized.length >= 2 && visible.length === 0 ? <Text style={styles.helperText}>{locale === "ar" ? "اختر قيمة مطابقة من نتائج البحث." : "Choose a matching value from the search results."}</Text> : null}</View>;
}
function Toggle({ label, value, onChange, styles }: { label: string; value: boolean; onChange: (value: boolean) => void; styles: ReturnType<typeof createStyles> }) { return <View style={styles.toggleRow}><Text style={styles.toggleLabel}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: styles.switchTrack.backgroundColor, true: styles.switchTrackActive.backgroundColor }} thumbColor={styles.switchThumb.backgroundColor} /></View>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 34, paddingBottom: 50, gap: 20 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rowRtl: { flexDirection: "row-reverse" }, back: { color: theme.text, fontSize: 14, fontWeight: "600", paddingVertical: 8 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.2 }, header: { gap: 8 }, title: { color: theme.text, fontSize: 30, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  section: { gap: 10, paddingTop: 4, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: theme.border }, sectionTitle: { color: theme.accent, fontSize: 13, lineHeight: 20, fontWeight: "800", marginBottom: 2 }, field: { gap: 7 }, label: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 4 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 12, minHeight: 48, paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 14 }, multiline: { minHeight: 92 }, placeholder: { color: theme.muted }, counter: { color: theme.muted, fontSize: 10, alignSelf: "flex-end" }, helperText: { color: theme.muted, fontSize: 10, lineHeight: 16 },
  suggestionList: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, overflow: "hidden" }, suggestion: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, suggestionText: { color: theme.text, fontSize: 12, fontWeight: "700" }, suggestionCode: { color: theme.accent, fontSize: 9, fontWeight: "800" },
  twoCol: { flexDirection: "row", gap: 9 }, col: { flex: 1 }, options: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, option: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, optionCompact: { paddingHorizontal: 9, paddingVertical: 7 }, optionActive: { borderColor: theme.accent, backgroundColor: theme.chip }, optionText: { color: theme.muted, fontSize: 11, fontWeight: "600" }, optionTextActive: { color: theme.text },
  toggleRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border }, toggleLabel: { color: theme.text, fontSize: 13 }, switchTrack: { backgroundColor: theme.grayMuted }, switchTrackActive: { backgroundColor: theme.accent }, switchThumb: { backgroundColor: theme.text },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, saveButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center" }, saveText: { color: theme.background, fontSize: 15, fontWeight: "800" }, reviewButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center" }, reviewText: { color: theme.text, fontSize: 14, fontWeight: "700" }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 },
}); }
