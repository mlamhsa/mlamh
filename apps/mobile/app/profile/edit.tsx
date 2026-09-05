import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getTalentProfile, updateTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { SAUDI_CITY_OPTIONS, TALENT_AVAILABILITY_OPTIONS, TALENT_GENDER_OPTIONS, type MobileOption } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

export default function EditTalentProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalitySlug, setNationalitySlug] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } });
          else setError(isArabic ? "تعذر تحميل بيانات الملف." : "Unable to load profile details.");
          return;
        }
        const item = result.item;
        setDisplayName(item.displayName);
        setBio(item.bio ?? "");
        setSkills(item.skills.join(", "));
        setCitySlug(item.citySlug);
        setGender(item.gender);
        setDateOfBirth(item.dateOfBirth ?? "");
        setNationalitySlug(item.nationalitySlug ?? item.nationality ?? "");
        setHeightCm(item.heightCm ? String(item.heightCm) : "");
        setAvailabilityStatus(item.availabilityStatus);
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل بيانات الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile details. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale]);

  async function save() {
    if (saving) return;
    const normalizedSkills = skills.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
    const parsedHeight = heightCm.trim() ? Number(heightCm) : null;
    if (displayName.trim().length > 80 || bio.trim().length > 1200 || normalizedSkills.some((item) => item.length > 40) || (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 80 || parsedHeight > 250)) || (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))) {
      setError(isArabic ? "راجع البيانات المدخلة، خصوصًا تاريخ الميلاد والطول." : "Review your entries, especially date of birth and height.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const result = await updateTalentProfile(locale, {
        displayName, bio, skills: normalizedSkills, citySlug, gender,
        dateOfBirth: dateOfBirth || null, nationalitySlug: nationalitySlug.trim() || null,
        heightCm: parsedHeight, availabilityStatus,
      });
      if (!result.ok) {
        setError(isArabic ? "تعذر حفظ التعديلات. راجع البيانات وحاول مرة أخرى." : "Unable to save changes. Review the details and try again.");
        return;
      }
      router.replace("/profile");
    } catch {
      setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again.");
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator accessibilityLabel={isArabic ? "جارٍ تحميل الملف" : "Loading profile"} size="large" color={theme.accent} /></View>;
  const align = isRtl ? "right" : "left";

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
      <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign: align }]}>{isArabic ? "بيانات ملفك" : "Profile details"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign: align }]}>{isArabic ? "حدّث البيانات الأساسية المطلوبة للمراجعة والظهور في الفرص المناسبة." : "Keep the core details required for review and matching opportunities up to date."}</Text></View>

      <Section title={isArabic ? "البيانات الأساسية" : "Core details"} styles={styles} isArabic={isArabic} align={align}>
        <FieldLabel text={isArabic ? "الاسم المهني" : "Professional name"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={displayName} onChangeText={setDisplayName} maxLength={80} placeholder={isArabic ? "اسمك المهني" : "Your professional name"} placeholderTextColor={theme.muted} style={[styles.input, isArabic && styles.arabicText, { textAlign: align }]} />
        <FieldLabel text={isArabic ? "المدينة" : "City"} styles={styles} isArabic={isArabic} align={align} />
        <OptionWrap options={SAUDI_CITY_OPTIONS} value={citySlug} onChange={setCitySlug} locale={locale} styles={styles} />
        <FieldLabel text={isArabic ? "الجنس" : "Gender"} styles={styles} isArabic={isArabic} align={align} />
        <OptionWrap options={TALENT_GENDER_OPTIONS} value={gender} onChange={setGender} locale={locale} styles={styles} />
        <FieldLabel text={isArabic ? "تاريخ الميلاد" : "Date of birth"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} keyboardType="numbers-and-punctuation" placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} style={[styles.input, { textAlign: align }]} />
        <FieldLabel text={isArabic ? "الجنسية" : "Nationality"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={nationalitySlug} onChangeText={setNationalitySlug} autoCapitalize="none" placeholder={isArabic ? "مثال: saudi" : "Example: saudi"} placeholderTextColor={theme.muted} style={[styles.input, { textAlign: align }]} />
        <FieldLabel text={isArabic ? "الطول (سم)" : "Height (cm)"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="175" placeholderTextColor={theme.muted} style={[styles.input, { textAlign: align }]} />
      </Section>

      <Section title={isArabic ? "التوفر والخبرة" : "Availability & experience"} styles={styles} isArabic={isArabic} align={align}>
        <FieldLabel text={isArabic ? "حالة التوفر" : "Availability"} styles={styles} isArabic={isArabic} align={align} />
        <OptionWrap options={TALENT_AVAILABILITY_OPTIONS} value={availabilityStatus} onChange={setAvailabilityStatus} locale={locale} styles={styles} />
        <FieldLabel text={isArabic ? "نبذة" : "Bio"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={bio} onChangeText={setBio} maxLength={1200} multiline textAlignVertical="top" placeholder={isArabic ? "عرّف بنفسك وخبرتك باختصار" : "Tell clients about you and your experience"} placeholderTextColor={theme.muted} style={[styles.input, styles.bioInput, isArabic && styles.arabicText, { textAlign: align }]} />
        <Text style={styles.counter}>{bio.length}/1200</Text>
        <FieldLabel text={isArabic ? "المهارات" : "Skills"} styles={styles} isArabic={isArabic} align={align} />
        <TextInput value={skills} onChangeText={setSkills} multiline placeholder={isArabic ? "تمثيل، إلقاء، تصوير…" : "Acting, voice, photography…"} placeholderTextColor={theme.muted} style={[styles.input, styles.skillsInput, isArabic && styles.arabicText, { textAlign: align }]} />
      </Section>

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, isArabic && styles.arabicText, { textAlign: align }]}>{error}</Text></View> : null}
      <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, saving && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.saveText, isArabic && styles.arabicText]}>{isArabic ? "حفظ التعديلات" : "Save changes"}</Text>}</Pressable>
      <Pressable disabled={saving} onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={[styles.reviewText, isArabic && styles.arabicText]}>{isArabic ? "مراجعة الجاهزية" : "Review readiness"}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Section({ title, children, styles, isArabic, align }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isArabic: boolean; align: "left" | "right" }) { return <View style={styles.section}><Text style={[styles.sectionTitle, isArabic && styles.arabicText, { textAlign: align }]}>{title}</Text>{children}</View>; }
function FieldLabel({ text, styles, isArabic, align }: { text: string; styles: ReturnType<typeof createStyles>; isArabic: boolean; align: "left" | "right" }) { return <Text style={[styles.label, isArabic && styles.arabicText, { textAlign: align }]}>{text}</Text>; }
function OptionWrap({ options, value, onChange, locale, styles }: { options: MobileOption[]; value: string | null; onChange: (value: string) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <View style={styles.options}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.option, value === option.value && styles.optionActive]}><Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>{locale === "ar" ? option.ar : option.en}</Text></Pressable>)}</View>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 20, paddingTop: 34, paddingBottom: 50, gap: 20 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rowRtl: { flexDirection: "row-reverse" }, back: { color: theme.text, fontSize: 14, fontWeight: "600", paddingVertical: 8 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.2 }, header: { gap: 8 }, title: { color: theme.text, fontSize: 30, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  section: { gap: 10, paddingTop: 4 }, sectionTitle: { color: theme.accent, fontSize: 13, lineHeight: 20, fontWeight: "800", marginBottom: 2 }, label: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 4 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 11, fontSize: 15 }, bioInput: { minHeight: 130 }, skillsInput: { minHeight: 82 }, counter: { color: theme.muted, fontSize: 10, alignSelf: "flex-end" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, option: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, optionActive: { borderColor: theme.accent, backgroundColor: theme.chip }, optionText: { color: theme.muted, fontSize: 12, fontWeight: "600" }, optionTextActive: { color: theme.text },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, saveButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center" }, saveText: { color: theme.background, fontSize: 15, fontWeight: "800" }, reviewButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center" }, reviewText: { color: theme.text, fontSize: 14, fontWeight: "700" }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 }, arabicText: { letterSpacing: 0 },
}); }
