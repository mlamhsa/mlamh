import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getTalentProfile, updateTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function EditTalentProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
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
        setDisplayName(result.item.displayName);
        setBio(result.item.bio ?? "");
        setSkills(result.item.skills.join(", "));
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
    if (displayName.trim().length > 80 || bio.trim().length > 1200 || normalizedSkills.some((item) => item.length > 40)) {
      setError(isArabic ? "راجع طول الاسم أو النبذة أو المهارات." : "Check the length of your name, bio, or skills.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const result = await updateTalentProfile(locale, { displayName, bio, skills: normalizedSkills });
      if (!result.ok) {
        setError(isArabic ? "تعذر حفظ التعديلات. حاول مرة أخرى." : "Unable to save changes. Please try again.");
        return;
      }
      router.replace("/profile");
    } catch {
      setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator accessibilityLabel={isArabic ? "جارٍ تحميل الملف" : "Loading profile"} size="large" color={theme.accent} /></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
      <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "تعديل ملفك" : "Edit profile"}</Text><Text style={styles.subtitle}>{isArabic ? "حدّث بياناتك المهنية، ثم راجع جاهزية ملفك قبل إرساله للاعتماد." : "Update your professional details, then review your readiness before submitting for approval."}</Text></View>

      <View style={styles.formCard}>
        <FieldLabel text={isArabic ? "الاسم المهني" : "Professional name"} styles={styles} />
        <TextInput accessibilityLabel={isArabic ? "الاسم المهني" : "Professional name"} value={displayName} onChangeText={setDisplayName} maxLength={80} returnKeyType="next" placeholder={isArabic ? "اسمك المهني" : "Your professional name"} placeholderTextColor={theme.muted} style={styles.input} />

        <FieldLabel text={isArabic ? "نبذة" : "Bio"} styles={styles} />
        <TextInput accessibilityLabel={isArabic ? "النبذة" : "Bio"} value={bio} onChangeText={setBio} maxLength={1200} multiline textAlignVertical="top" placeholder={isArabic ? "عرّف بنفسك وخبرتك باختصار" : "Tell clients about you and your experience"} placeholderTextColor={theme.muted} style={[styles.input, styles.bioInput]} />
        <Text accessibilityLabel={isArabic ? `${bio.length} من 1200 حرف` : `${bio.length} of 1200 characters`} style={styles.counter}>{bio.length}/1200</Text>

        <FieldLabel text={isArabic ? "المهارات" : "Skills"} styles={styles} />
        <TextInput accessibilityLabel={isArabic ? "المهارات" : "Skills"} accessibilityHint={isArabic ? "افصل بين المهارات بفاصلة وبحد أقصى 12 مهارة" : "Separate skills with commas, maximum 12 skills"} value={skills} onChangeText={setSkills} multiline placeholder={isArabic ? "تمثيل، إلقاء، تصوير…" : "Acting, voice, photography…"} placeholderTextColor={theme.muted} style={[styles.input, styles.skillsInput]} />
        <Text style={styles.helper}>{isArabic ? "افصل بين المهارات بفاصلة — بحد أقصى 12 مهارة." : "Separate skills with commas — maximum 12 skills."}</Text>
      </View>

      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "حفظ التعديلات" : "Save changes"} accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "مراجعة الجاهزية وإرسال الملف" : "Review readiness and submit"} disabled={saving} onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={styles.reviewText}>{isArabic ? "مراجعة الجاهزية وإرسال الملف" : "Review readiness and submit"}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function FieldLabel({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) { return <Text style={styles.label}>{text}</Text>; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 50, gap: 20 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700", paddingVertical: 8 }, header: { gap: 9 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  formCard: { gap: 10, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface }, label: { color: theme.text, fontSize: 13, fontWeight: "700", marginTop: 6 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, borderRadius: 18, minHeight: 50, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15 }, bioInput: { minHeight: 150 }, skillsInput: { minHeight: 90 }, counter: { color: theme.muted, fontSize: 10, alignSelf: "flex-end" }, helper: { color: theme.muted, fontSize: 11, lineHeight: 18 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, saveButton: { backgroundColor: theme.accent, borderRadius: 18, minHeight: 52, paddingVertical: 16, alignItems: "center", justifyContent: "center" }, saveText: { color: "#181818", fontSize: 15, fontWeight: "800" }, reviewButton: { borderWidth: 1, borderColor: theme.accent, borderRadius: 18, minHeight: 50, paddingVertical: 15, alignItems: "center", justifyContent: "center" }, reviewText: { color: theme.accent, fontSize: 14, fontWeight: "700" }, pressed: { opacity: 0.72 }
}); }
