import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherOpportunity, managePublisherOpportunity, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function EditPublisherOpportunityScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const opportunityId = Number(rawId);
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [city, setCity] = useState(""); const [countryCode, setCountryCode] = useState(""); const [currency, setCurrency] = useState(""); const [budget, setBudget] = useState("");
  const [opportunityType, setOpportunityType] = useState<"actor" | "model">("actor"); const [compensationType, setCompensationType] = useState<"fixed" | "negotiable" | "unpaid">("fixed");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  useEffect(() => { void (async () => { const result = await getPublisherOpportunity(opportunityId, locale); if (!result) { setError(locale === "ar" ? "تعذر تحميل الفرصة." : "Unable to load opportunity."); setLoading(false); return; } setDetail(result); setTitle(result.opportunity.title); setDescription(result.opportunity.description); setCity(result.opportunity.city || ""); setCountryCode(result.opportunity.countryCode || ""); setCurrency(result.opportunity.currency || ""); setBudget(result.opportunity.budget || ""); if (result.opportunity.opportunityType === "model") setOpportunityType("model"); if (["fixed","negotiable","unpaid"].includes(result.opportunity.compensationType || "")) setCompensationType(result.opportunity.compensationType as "fixed" | "negotiable" | "unpaid"); setLoading(false); })(); }, [locale, opportunityId]);

  async function save() {
    if (title.trim().length < 4 || description.trim().length < 20) { setError(locale === "ar" ? "العنوان يجب أن يكون واضحًا والوصف 20 حرفًا على الأقل." : "Use a clear title and a description of at least 20 characters."); return; }
    setSaving(true); setError(null);
    const result = await managePublisherOpportunity(opportunityId, { action: "edit", title, description, city, countryCode, currency, budget: compensationType === "unpaid" ? "" : budget, opportunityType, compensationType });
    setSaving(false);
    if (!result.ok) { setError(locale === "ar" ? "تعذر حفظ التعديلات. راجع الدولة والعملة والبيانات المطلوبة." : "Unable to save. Check country, currency, and required fields."); return; }
    router.back();
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!detail || detail.opportunity.status === "archived") return <View style={styles.centered}><Text style={styles.error}>{error || (locale === "ar" ? "لا يمكن تعديل فرصة مؤرشفة." : "Archived opportunities cannot be edited.")}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable></View>;

  return <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>{locale === "ar" ? "إلغاء" : "Cancel"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH · OWNER</Text><Text style={styles.title}>{locale === "ar" ? "تعديل الفرصة" : "Edit opportunity"}</Text><Text style={styles.body}>{locale === "ar" ? "حدّث المعلومات التي ستظهر للمواهب." : "Update the information talents will see."}</Text></View>
    <Field label={locale === "ar" ? "العنوان" : "Title"} value={title} onChangeText={setTitle} styles={styles} />
    <Field label={locale === "ar" ? "الوصف" : "Description"} value={description} onChangeText={setDescription} multiline styles={styles} />
    <Text style={styles.label}>{locale === "ar" ? "نوع الموهبة" : "Talent type"}</Text><View style={styles.options}>{(["actor","model"] as const).map(v => <Option key={v} active={opportunityType === v} label={v === "actor" ? (locale === "ar" ? "ممثل" : "Actor") : (locale === "ar" ? "مودل" : "Model")} onPress={() => setOpportunityType(v)} styles={styles} />)}</View>
    <Field label={locale === "ar" ? "المدينة" : "City"} value={city} onChangeText={setCity} placeholder={locale === "ar" ? "مثال: اسم المدينة" : "Example: City name"} styles={styles} />
    <Field label={locale === "ar" ? "رمز الدولة" : "Country code"} value={countryCode} onChangeText={v => setCountryCode(v.toUpperCase())} placeholder="ISO · AE / SA / QA" maxLength={2} autoCapitalize="characters" styles={styles} />
    <Text style={styles.label}>{locale === "ar" ? "المقابل" : "Compensation"}</Text><View style={styles.options}>{(["fixed","negotiable","unpaid"] as const).map(v => <Option key={v} active={compensationType === v} label={compLabel(v, locale)} onPress={() => setCompensationType(v)} styles={styles} />)}</View>
    {compensationType !== "unpaid" ? <><Field label={locale === "ar" ? "القيمة" : "Amount"} value={budget} onChangeText={setBudget} placeholder={locale === "ar" ? "مثال: 1500" : "Example: 1500"} styles={styles} /><Field label={locale === "ar" ? "العملة" : "Currency"} value={currency} onChangeText={v => setCurrency(v.toUpperCase())} placeholder="ISO · AED / SAR / QAR" maxLength={3} autoCapitalize="characters" styles={styles} /></> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={saving} style={[styles.save, saving && styles.disabled]} onPress={() => void save()} accessibilityRole="button"><Text style={styles.saveText}>{saving ? (locale === "ar" ? "جارٍ الحفظ…" : "Saving…") : (locale === "ar" ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
  </ScrollView>;
}

function Field({ label, styles, multiline, ...props }: { label: string; styles: ReturnType<typeof createStyles>; multiline?: boolean } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={styles.placeholder.color} /></View>; }
function Option({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text></Pressable>; }
function compLabel(value: string, locale: "ar" | "en") { if (locale === "ar") return value === "fixed" ? "محدد" : value === "negotiable" ? "قابل للتفاوض" : "بدون مقابل"; return value === "fixed" ? "Fixed" : value === "negotiable" ? "Negotiable" : "Unpaid"; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, gap: 18, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 70, gap: 15 }, back: { color: theme.accent, fontSize: 13, fontWeight: "700" }, header: { gap: 8, marginVertical: 8 }, eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "800", letterSpacing: 2 }, title: { color: theme.text, fontSize: 32, fontWeight: "300" }, body: { color: theme.muted, fontSize: 13, lineHeight: 21 }, field: { gap: 7 }, label: { color: theme.text, fontSize: 12, fontWeight: "700" }, input: { minHeight: 50, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 14, color: theme.text, backgroundColor: theme.surface, fontSize: 14 }, multiline: { minHeight: 150, paddingTop: 14 }, placeholder: { color: theme.muted }, options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, option: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11, backgroundColor: theme.surface }, optionActive: { backgroundColor: theme.accent, borderColor: theme.accent }, optionText: { color: theme.text, fontSize: 11, fontWeight: "700" }, optionTextActive: { color: "#181818" }, save: { marginTop: 6, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: theme.accent }, saveText: { color: "#181818", fontSize: 13, fontWeight: "800" }, disabled: { opacity: 0.55 }, error: { color: "#EF8B8B", fontSize: 12, lineHeight: 18, textAlign: "center" } }); }
