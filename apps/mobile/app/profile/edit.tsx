import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getTalentProfile, updateTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function EditTalentProfileScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await getTalentProfile(locale);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/edit" } });
        else setError(locale === "ar" ? "تعذر تحميل بيانات الملف." : "Unable to load profile details.");
        setLoading(false);
        return;
      }
      setDisplayName(result.item.displayName);
      setBio(result.item.bio ?? "");
      setSkills(result.item.skills.join(", "));
      setLoading(false);
    })();
  }, [locale]);

  async function save() {
    if (saving) return;
    const normalizedSkills = skills.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
    if (displayName.trim().length > 80 || bio.trim().length > 1200 || normalizedSkills.some((item) => item.length > 40)) {
      setError(locale === "ar" ? "راجع طول الاسم أو النبذة أو المهارات." : "Check the length of your name, bio, or skills.");
      return;
    }
    setSaving(true); setError(null);
    const result = await updateTalentProfile(locale, { displayName, bio, skills: normalizedSkills });
    setSaving(false);
    if (!result.ok) {
      setError(locale === "ar" ? "تعذر حفظ التعديلات. حاول مرة أخرى." : "Unable to save changes. Please try again.");
      return;
    }
    router.replace("/profile");
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
      <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "تعديل ملفك" : "Edit profile"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "حدّث بياناتك المهنية، ثم راجع جاهزية ملفك قبل إرساله للاعتماد." : "Update your professional details, then review your readiness before submitting for approval."}</Text></View>

      <View style={styles.formCard}>
        <FieldLabel text={locale === "ar" ? "الاسم المهني" : "Professional name"} styles={styles} />
        <TextInput value={displayName} onChangeText={setDisplayName} maxLength={80} placeholder={locale === "ar" ? "اسمك المهني" : "Your professional name"} placeholderTextColor={theme.muted} style={styles.input} />

        <FieldLabel text={locale === "ar" ? "نبذة" : "Bio"} styles={styles} />
        <TextInput value={bio} onChangeText={setBio} maxLength={1200} multiline textAlignVertical="top" placeholder={locale === "ar" ? "عرّف بنفسك وخبرتك باختصار" : "Tell clients about you and your experience"} placeholderTextColor={theme.muted} style={[styles.input, styles.bioInput]} />
        <Text style={styles.counter}>{bio.length}/1200</Text>

        <FieldLabel text={locale === "ar" ? "المهارات" : "Skills"} styles={styles} />
        <TextInput value={skills} onChangeText={setSkills} multiline placeholder={locale === "ar" ? "تمثيل، إلقاء، تصوير…" : "Acting, voice, photography…"} placeholderTextColor={theme.muted} style={[styles.input, styles.skillsInput]} />
        <Text style={styles.helper}>{locale === "ar" ? "افصل بين المهارات بفاصلة — بحد أقصى 12 مهارة." : "Separate skills with commas — maximum 12 skills."}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}><Text style={styles.saveText}>{saving ? (locale === "ar" ? "جارٍ الحفظ…" : "Saving…") : (locale === "ar" ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
      <Pressable disabled={saving} onPress={() => router.push("/profile/review")} style={styles.reviewButton}><Text style={styles.reviewText}>{locale === "ar" ? "مراجعة الجاهزية وإرسال الملف" : "Review readiness and submit"}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function FieldLabel({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) { return <Text style={styles.label}>{text}</Text>; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 50, gap: 20 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700" }, header: { gap: 9 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  formCard: { gap: 10, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface }, label: { color: theme.text, fontSize: 13, fontWeight: "700", marginTop: 6 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15 }, bioInput: { minHeight: 150 }, skillsInput: { minHeight: 90 }, counter: { color: theme.muted, fontSize: 10, alignSelf: "flex-end" }, helper: { color: theme.muted, fontSize: 11, lineHeight: 18 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, saveButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" }, saveText: { color: "#181818", fontSize: 15, fontWeight: "800" }, reviewButton: { borderWidth: 1, borderColor: theme.accent, borderRadius: 18, paddingVertical: 15, alignItems: "center" }, reviewText: { color: theme.accent, fontSize: 14, fontWeight: "700" }, pressed: { opacity: 0.72 }
}); }
