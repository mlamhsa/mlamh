import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Send, Sparkles } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale, toLatinDigits } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";

type TalentType = "actor" | "model" | "mixed";

type FormState = {
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  projectTitle: string;
  talentType: TalentType;
  requiredCount: string;
  city: string;
  workDate: string;
  budget: string;
  brief: string;
};

const INITIAL_FORM: FormState = {
  clientName: "",
  companyName: "",
  email: "",
  phone: "",
  projectTitle: "",
  talentType: "actor",
  requiredCount: "1",
  city: "",
  workDate: "",
  budget: "",
  brief: "",
};

function latinDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export default function CastingScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = useMemo(() => createStyles(darkTheme), []);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError(null);
  }

  function validate() {
    if (!form.clientName.trim() || !form.projectTitle.trim() || !form.brief.trim()) {
      return isArabic ? "أكمل الاسم واسم المشروع والـBrief." : "Complete your name, project title, and casting brief.";
    }
    if (!form.email.trim() && !form.phone.trim()) {
      return isArabic ? "أضف بريدًا إلكترونيًا أو رقم تواصل." : "Add an email address or contact number.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return isArabic ? "صيغة البريد الإلكتروني غير صحيحة." : "Enter a valid email address.";
    }
    const count = Number(latinDigits(form.requiredCount));
    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      return isArabic ? "العدد التقريبي يجب أن يكون بين 1 و1000." : "Approximate count must be between 1 and 1000.";
    }
    const workDate = latinDigits(form.workDate.trim());
    if (workDate && !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
      return isArabic ? "اكتب تاريخ العمل بصيغة YYYY-MM-DD." : "Enter the work date as YYYY-MM-DD.";
    }
    return null;
  }

  async function submit() {
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/casting/request`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.clientName.trim(),
          company_name: form.companyName.trim(),
          contact_email: form.email.trim(),
          contact_phone: latinDigits(form.phone.trim()),
          project_title: form.projectTitle.trim(),
          talent_type: form.talentType,
          required_count: Number(latinDigits(form.requiredCount)),
          city: form.city.trim(),
          work_date: latinDigits(form.workDate.trim()),
          budget: latinDigits(form.budget.trim()),
          brief: form.brief.trim(),
          locale,
          company_website: "",
        }),
      });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; requestId?: unknown; error?: unknown };
      if (!response.ok || data.ok !== true) {
        const serverMessage = typeof data.error === "string" ? data.error : "";
        throw new Error(serverMessage || (isArabic ? "تعذر إرسال الطلب الآن." : "Unable to submit the brief right now."));
      }
      setRequestId(Number(data.requestId) || 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isArabic ? "تعذر إرسال الطلب الآن. حاول مرة أخرى." : "Unable to submit the brief. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (requestId !== null) {
    return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.successWrap}>
        <View style={styles.successIcon}><CheckCircle2 size={32} color={darkTheme.accent} strokeWidth={1.8} /></View>
        <Text accessibilityRole="header" style={[styles.successTitle, isRtl && styles.textRtl]}>{isArabic ? "تم استلام الـBrief" : "Brief received"}</Text>
        <Text style={[styles.successBody, isRtl && styles.textRtl]}>{isArabic ? "وصل احتياجك إلى فريق MLAMH Casting. سنراجع النطاق قبل أي التزام أو نشر، وسنتواصل معك على بيانات التواصل التي أرسلتها." : "Your request is with the MLAMH Casting team. We will review the scope before any commitment or publication and contact you using the details you provided."}</Text>
        {requestId ? <Text style={styles.requestId}>#{requestId}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace("/opportunities")} style={styles.primary}><Text style={styles.primaryText}>{isArabic ? "العودة إلى الفرص" : "Back to opportunities"}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setRequestId(null); setForm(INITIAL_FORM); }} style={styles.secondary}><Text style={styles.secondaryText}>{isArabic ? "إرسال Brief آخر" : "Send another brief"}</Text></Pressable>
      </View>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={[styles.top, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.backButton}><BackIcon size={21} color={darkTheme.text} /></Pressable>
          <Text style={styles.brand}>MLAMH CASTING</Text>
        </View>

        <View style={styles.hero}>
          <View style={[styles.eyebrowRow, isRtl && styles.rowRtl]}><Sparkles size={16} color={darkTheme.accent} /><Text style={styles.eyebrow}>MANAGED CASTING</Text></View>
          <Text accessibilityRole="header" style={[styles.title, isRtl && styles.textRtl]}>{isArabic ? "أرسل احتياج الكاستينغ من التطبيق" : "Send your casting brief in-app"}</Text>
          <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "لا تحتاج تجهيز إعلان كامل. أرسل ما تعرفه الآن، وسيراجع فريق ملامح النطاق قبل أي التزام أو نشر." : "You do not need a finished casting notice. Send what you know now and MLAMH will review the scope before any commitment or publication."}</Text>
        </View>

        <Section title={isArabic ? "بيانات التواصل" : "Contact details"} isRtl={isRtl} styles={styles}>
          <Field label={isArabic ? "الاسم *" : "Your name *"} value={form.clientName} onChangeText={(value) => update("clientName", value)} isRtl={isRtl} styles={styles} maxLength={120} />
          <Field label={isArabic ? "الشركة / الجهة" : "Company / organization"} value={form.companyName} onChangeText={(value) => update("companyName", value)} isRtl={isRtl} styles={styles} maxLength={160} />
          <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={form.email} onChangeText={(value) => update("email", value)} isRtl={isRtl} styles={styles} maxLength={180} keyboardType="email-address" autoCapitalize="none" />
          <Field label={isArabic ? "رقم التواصل" : "Contact number"} value={form.phone} onChangeText={(value) => update("phone", latinDigits(value))} isRtl={isRtl} styles={styles} maxLength={50} keyboardType="phone-pad" />
        </Section>

        <Section title={isArabic ? "المشروع" : "Project"} isRtl={isRtl} styles={styles}>
          <Field label={isArabic ? "اسم المشروع *" : "Project title *"} value={form.projectTitle} onChangeText={(value) => update("projectTitle", value)} isRtl={isRtl} styles={styles} maxLength={180} />
          <Text style={[styles.label, isRtl && styles.textRtl]}>{isArabic ? "المواهب المطلوبة *" : "Talent needed *"}</Text>
          <View style={[styles.chips, isRtl && styles.rowRtl]}>
            {(["actor", "model", "mixed"] as TalentType[]).map((type) => {
              const labels = type === "actor" ? ["ممثلون", "Actors"] : type === "model" ? ["مودلز", "Models"] : ["ممثلون ومودلز", "Actors & Models"];
              const active = form.talentType === type;
              return <Pressable key={type} onPress={() => update("talentType", type)} style={[styles.chip, active && styles.chipActive]} accessibilityState={{ selected: active }}><Text style={[styles.chipText, active && styles.chipTextActive]}>{isArabic ? labels[0] : labels[1]}</Text></Pressable>;
            })}
          </View>
          <Field label={isArabic ? "العدد التقريبي" : "Approx. count"} value={form.requiredCount} onChangeText={(value) => update("requiredCount", latinDigits(value).replace(/[^0-9]/g, ""))} isRtl={isRtl} styles={styles} maxLength={4} keyboardType="number-pad" />
          <Field label={isArabic ? "المدينة" : "City"} value={form.city} onChangeText={(value) => update("city", value)} isRtl={isRtl} styles={styles} maxLength={100} />
          <Field label={isArabic ? "تاريخ العمل (YYYY-MM-DD)" : "Work date (YYYY-MM-DD)"} value={form.workDate} onChangeText={(value) => update("workDate", latinDigits(value).replace(/[^0-9-]/g, ""))} isRtl={isRtl} styles={styles} maxLength={10} keyboardType="numbers-and-punctuation" />
          <Field label={isArabic ? "الميزانية أو نطاق الأجر" : "Budget or compensation range"} value={form.budget} onChangeText={(value) => update("budget", latinDigits(value))} isRtl={isRtl} styles={styles} maxLength={100} placeholder={isArabic ? "مثال: 5000 ريال أو حسب الاتفاق" : "Example: SAR 5000 or negotiable"} />
        </Section>

        <Section title={isArabic ? "الـBrief" : "Casting brief"} isRtl={isRtl} styles={styles}>
          <Text style={[styles.label, isRtl && styles.textRtl]}>{isArabic ? "اشرح الاحتياج *" : "Describe what you need *"}</Text>
          <TextInput multiline value={form.brief} onChangeText={(value) => update("brief", value)} maxLength={5000} textAlignVertical="top" placeholder={isArabic ? "نوع المشروع، الأدوار أو المواصفات، الاستخدام، مكان التصوير، المدة وأي تفاصيل مهمة." : "Project type, roles or profiles needed, usage, location, duration, and any important details."} placeholderTextColor={darkTheme.grayMuted} style={[styles.textArea, { textAlign: isRtl ? "right" : "left" }]} />
        </Section>

        <Text style={[styles.note, isRtl && styles.textRtl]}>{isArabic ? "إرسال الطلب لا يعني قبول المشروع أو وجود التزام مالي. نراجع الـBrief أولًا ثم نحدد النطاق والخدمة المناسبة." : "Submitting a request does not create a booking or payment obligation. We review the brief first and confirm scope before work begins."}</Text>
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.errorText, isRtl && styles.textRtl]}>{error}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting, disabled: submitting }} disabled={submitting} onPress={() => void submit()} style={[styles.primary, submitting && styles.disabled]}><Send size={18} color={darkTheme.background} /><Text style={styles.primaryText}>{submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الـBrief إلى MLAMH Casting" : "Send brief to MLAMH Casting")}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Section({ title, children, isRtl, styles }: { title: string; children: React.ReactNode; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{title}</Text>{children}</View>;
}

function Field({ label, value, onChangeText, isRtl, styles, ...inputProps }: { label: string; value: string; onChangeText: (value: string) => void; isRtl: boolean; styles: ReturnType<typeof createStyles> } & Omit<React.ComponentProps<typeof TextInput>, "value" | "onChangeText" | "style">) {
  return <View style={styles.field}><Text style={[styles.label, isRtl && styles.textRtl]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholderTextColor={darkTheme.grayMuted} style={[styles.input, { textAlign: isRtl ? "right" : "left" }]} {...inputProps} /></View>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 54, gap: 18, width: "100%", maxWidth: 700, alignSelf: "center" },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
    rowRtl: { flexDirection: "row-reverse" },
    textRtl: { textAlign: "right", writingDirection: "rtl" },
    backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    brand: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
    hero: { paddingVertical: 12, gap: 9 },
    eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
    title: { color: theme.text, fontSize: 31, lineHeight: 40, fontWeight: "700" },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 22 },
    section: { borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, padding: 16, gap: 13 },
    sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "800", marginBottom: 2 },
    field: { gap: 7 },
    label: { color: theme.muted, fontSize: 11, fontWeight: "700" },
    input: { minHeight: 50, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 14, fontSize: 14 },
    textArea: { minHeight: 150, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.background, color: theme.text, padding: 14, fontSize: 14, lineHeight: 22 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, justifyContent: "center", paddingHorizontal: 14 },
    chipActive: { borderColor: theme.accent, backgroundColor: "#C9A96218" },
    chipText: { color: theme.muted, fontSize: 11, fontWeight: "700" },
    chipTextActive: { color: theme.accent },
    note: { color: theme.grayMuted, fontSize: 10, lineHeight: 17 },
    errorBox: { borderWidth: 1, borderColor: "#E59A9A44", borderRadius: 13, backgroundColor: "#E59A9A10", padding: 13 },
    errorText: { color: "#E8A7A7", fontSize: 12, lineHeight: 19 },
    primary: { minHeight: 56, borderRadius: 15, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, paddingHorizontal: 18 },
    primaryText: { color: theme.background, fontSize: 13, fontWeight: "900", textAlign: "center" },
    secondary: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
    secondaryText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    disabled: { opacity: 0.55 },
    successWrap: { flex: 1, paddingHorizontal: 24, justifyContent: "center", alignItems: "stretch", gap: 15, maxWidth: 560, width: "100%", alignSelf: "center" },
    successIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A96212", alignItems: "center", justifyContent: "center", alignSelf: "center" },
    successTitle: { color: theme.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
    successBody: { color: theme.muted, fontSize: 13, lineHeight: 22, textAlign: "center" },
    requestId: { color: theme.accent, fontSize: 14, fontWeight: "800", textAlign: "center" },
  });
}
