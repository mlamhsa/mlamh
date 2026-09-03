import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { createPublisherOpportunityDraft } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function NewPublisherOpportunityScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"actor" | "model">("actor");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [compensation, setCompensation] = useState<"fixed" | "negotiable" | "unpaid">("fixed");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDraft() {
    setSaving(true);
    setError(null);
    const result = await createPublisherOpportunityDraft({
      title,
      description,
      opportunityType: type,
      city,
      countryCode: countryCode.trim().toUpperCase() || undefined,
      compensationType: compensation,
      budget: compensation === "unpaid" ? undefined : budget,
      currency: compensation === "unpaid" ? undefined : currency.trim().toUpperCase() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      const messages: Record<string, string> = {
        INVALID_TITLE: locale === "ar" ? "العنوان قصير جدًا." : "The title is too short.",
        INVALID_DESCRIPTION: locale === "ar" ? "أضف وصفًا أوضح للفرصة." : "Add a clearer opportunity description.",
        INVALID_COUNTRY: locale === "ar" ? "استخدم رمز دولة من حرفين مثل AE أو SA." : "Use a two-letter country code such as AE or SA.",
        INVALID_CURRENCY: locale === "ar" ? "استخدم رمز عملة من ثلاثة أحرف مثل AED أو SAR." : "Use a three-letter currency code such as AED or SAR.",
        PUBLISHER_NOT_APPROVED: locale === "ar" ? "يجب اعتماد حساب الجهة قبل إنشاء الفرص." : "Publisher approval is required before creating opportunities.",
        PUBLISHER_NOT_VERIFIED: locale === "ar" ? "يجب توثيق الجهة قبل إنشاء الفرص." : "Your organization must be verified before creating opportunities.",
        ACCOUNT_RESTRICTED: locale === "ar" ? "الحساب غير متاح لإنشاء فرص حاليًا." : "This account cannot create opportunities right now.",
      };
      setError(messages[result.code] ?? (locale === "ar" ? "تعذر حفظ المسودة." : "Unable to save draft."));
      return;
    }
    router.replace(`/publisher/opportunities/${result.item.id}`);
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "فرصة جديدة" : "New opportunity"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "ابدأ بمسودة، راجع التفاصيل، ثم أرسلها للمراجعة قبل ظهورها للمواهب." : "Start with a draft, review the details, then submit it for review before it becomes visible to talent."}</Text></View>
    <Field label={locale === "ar" ? "عنوان الفرصة" : "Opportunity title"} styles={styles}><TextInput value={title} onChangeText={setTitle} placeholder={locale === "ar" ? "مثال: موهبة لحملة تجارية" : "Example: Talent for a commercial campaign"} placeholderTextColor={theme.muted} style={styles.input} /></Field>
    <Field label={locale === "ar" ? "الفئة" : "Category"} styles={styles}><View style={styles.choices}><Choice active={type === "actor"} label={locale === "ar" ? "ممثل" : "Actor"} onPress={() => setType("actor")} styles={styles} /><Choice active={type === "model"} label={locale === "ar" ? "مودل" : "Model"} onPress={() => setType("model")} styles={styles} /></View></Field>
    <Field label={locale === "ar" ? "الوصف" : "Description"} styles={styles}><TextInput multiline value={description} onChangeText={setDescription} placeholder={locale === "ar" ? "اشرح المشروع، الدور والمتطلبات الأساسية…" : "Describe the project, role and core requirements…"} placeholderTextColor={theme.muted} style={[styles.input, styles.textarea]} /></Field>
    <Field label={locale === "ar" ? "المدينة" : "City"} styles={styles}><TextInput value={city} onChangeText={setCity} placeholder={locale === "ar" ? "مثال: اسم المدينة" : "Example: City name"} placeholderTextColor={theme.muted} style={styles.input} /></Field>
    <Field label={locale === "ar" ? "رمز الدولة" : "Country code"} styles={styles}><TextInput value={countryCode} onChangeText={(value) => setCountryCode(value.toUpperCase())} maxLength={2} autoCapitalize="characters" placeholder="ISO · AE / SA / QA" placeholderTextColor={theme.muted} style={styles.input} /></Field>
    <Field label={locale === "ar" ? "المقابل" : "Compensation"} styles={styles}><View style={styles.choices}><Choice active={compensation === "fixed"} label={locale === "ar" ? "محدد" : "Fixed"} onPress={() => setCompensation("fixed")} styles={styles} /><Choice active={compensation === "negotiable"} label={locale === "ar" ? "قابل للتفاوض" : "Negotiable"} onPress={() => setCompensation("negotiable")} styles={styles} /><Choice active={compensation === "unpaid"} label={locale === "ar" ? "بدون مقابل" : "Unpaid"} onPress={() => setCompensation("unpaid")} styles={styles} /></View></Field>
    {compensation !== "unpaid" ? <><Field label={locale === "ar" ? "القيمة" : "Amount"} styles={styles}><TextInput value={budget} onChangeText={setBudget} placeholder={locale === "ar" ? "مثال: 1500" : "Example: 1500"} placeholderTextColor={theme.muted} style={styles.input} /></Field><Field label={locale === "ar" ? "العملة" : "Currency"} styles={styles}><TextInput value={currency} onChangeText={(value) => setCurrency(value.toUpperCase())} maxLength={3} autoCapitalize="characters" placeholder="ISO · AED / SAR / QAR" placeholderTextColor={theme.muted} style={styles.input} /></Field></> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={saving} onPress={() => void saveDraft()} style={[styles.save, saving && styles.disabled]} accessibilityRole="button"><Text style={styles.saveText}>{saving ? (locale === "ar" ? "جارٍ الحفظ…" : "Saving…") : (locale === "ar" ? "حفظ كمسودة" : "Save draft")}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ label, children, styles }: { label: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>; }
function Choice({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]} accessibilityRole="button"><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 50, gap: 18 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700" }, header: { gap: 8 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 }, field: { gap: 8 }, fieldLabel: { color: theme.text, fontSize: 12, fontWeight: "700" }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15 }, textarea: { minHeight: 130, textAlignVertical: "top" }, choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choice: { borderWidth: 1, borderColor: theme.border, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 9 }, choiceActive: { backgroundColor: theme.accent, borderColor: theme.accent }, choiceText: { color: theme.muted, fontSize: 12, fontWeight: "600" }, choiceTextActive: { color: "#181818" }, save: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 4 }, saveText: { color: "#181818", fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.5 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 } }); }
