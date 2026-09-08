import { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronLeft, ChevronRight, Drama, Sparkles, UserRound } from "lucide-react-native";

import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type SignupIntent = "actor" | "model" | "publisher";
type AccountType = "talent" | "publisher";

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  return `+${trimmed.replace(/\D/g, "")}`;
}

function isValidPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export default function SignupScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<SignupIntent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountType: AccountType = intent === "publisher" ? "publisher" : "talent";
  const talentIntent = intent === "actor" || intent === "model" ? intent : "";
  const nativeRedirect = accountType === "publisher" ? "mlamh://publisher/setup" : "mlamh://onboarding";
  const textAlign = isRtl ? "right" : "left";
  const brandSource = isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  function goBack() {
    setError(null);
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  }

  function continueFromIntent() {
    if (!intent) {
      setError(isArabic ? "اختر كيف تريد استخدام ملامح للمتابعة." : "Choose how you want to use MLAMH to continue.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function signUp() {
    if (!intent) {
      setStep(1);
      setError(isArabic ? "اختر كيف تريد استخدام ملامح أولًا." : "Choose how you want to use MLAMH first.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedPhone = normalizePhone(phone);

    if (normalizedName.length < 2 || normalizedName.length > 100) return setError(isArabic ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
    if (!isValidPhone(normalizedPhone)) return setError(isArabic ? "أدخل رقم جوال دوليًا صحيحًا، مثل +9665XXXXXXXX." : "Enter a valid international mobile number, for example +9665XXXXXXXX.");
    if (!normalizedEmail) return setError(isArabic ? "أدخل بريدك الإلكتروني." : "Enter your email address.");
    if (password.length < 8) return setError(isArabic ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Your password must contain at least 8 characters.");
    if (password !== passwordConfirmation) return setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
    if (!acceptedTerms) return setError(isArabic ? "وافق على الشروط وسياسة الخصوصية للمتابعة." : "Accept the Terms and Privacy Policy to continue.");

    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: nativeRedirect,
          data: {
            full_name: normalizedName,
            display_name: accountType === "talent" ? normalizedName : null,
            contact_name: accountType === "publisher" ? normalizedName : null,
            phone: normalizedPhone,
            phone_verified: false,
            account_type: accountType,
            signup_intent: intent,
            talent_intent: talentIntent || null,
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (authError || !data.user) {
        const normalized = authError?.message?.toLowerCase() ?? "";
        setError(normalized.includes("already") || normalized.includes("registered")
          ? (isArabic ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول." : "An account already exists with this email. Try signing in.")
          : (isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check the details and try again."));
        return;
      }

      if (data.session) {
        if (accountType === "publisher") router.replace("/publisher/setup");
        else router.replace({ pathname: "/onboarding", params: talentIntent ? { intent: talentIntent } : undefined });
        return;
      }

      router.replace({
        pathname: "/verify-email",
        params: { email: normalizedEmail, accountType, talentIntent },
      });
    } catch {
      setError(isArabic ? "تعذر إنشاء الحساب الآن. تحقق من اتصالك وحاول مرة أخرى." : "Unable to create your account right now. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={[styles.topRow, isRtl && styles.rowRtl]}>
              <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={goBack} style={styles.iconButton}>
                <BackIcon size={22} color={theme.text} strokeWidth={1.8} />
              </Pressable>
              <Image source={brandSource} resizeMode="contain" style={styles.brandLogo} />
              <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "English" : "العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={styles.languageButton}>
                <Text style={styles.languageButtonText}>{isArabic ? "EN" : "العربية"}</Text>
              </Pressable>
            </View>

            <View style={[styles.progressRow, isRtl && styles.rowRtl]}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, step === 2 && styles.progressActive]} />
            </View>
            <Text style={[styles.stepLabel, { textAlign }]}>{isArabic ? `الخطوة ${step} من 2` : `Step ${step} of 2`}</Text>

            {step === 1 ? (
              <>
                <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.eyebrow, { textAlign }]}>{isArabic ? "ابدأ بما تريد" : "START WITH YOUR GOAL"}</Text>
                  <Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "كيف تريد استخدام ملامح؟" : "What do you want to do on MLAMH?"}</Text>
                  <Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "اختر هدفك فقط. سنجهز لك المسار المناسب بدون مصطلحات أو خطوات مربكة." : "Choose your goal. We'll prepare the right path without confusing setup steps."}</Text>
                </View>

                <View accessibilityRole="radiogroup" style={styles.intentList}>
                  <IntentCard
                    active={intent === "actor"}
                    icon="actor"
                    title={isArabic ? "أريد فرص تمثيل" : "I want acting opportunities"}
                    body={isArabic ? "أنشئ ملف ممثل وابدأ التقديم على الفرص المناسبة." : "Create an actor profile and apply to matching opportunities."}
                    onPress={() => { setIntent("actor"); setError(null); }}
                    isRtl={isRtl}
                    styles={styles}
                  />
                  <IntentCard
                    active={intent === "model"}
                    icon="model"
                    title={isArabic ? "أريد فرص مودل" : "I want modeling opportunities"}
                    body={isArabic ? "أنشئ ملف مودل واعرض صورك وبياناتك المهنية." : "Create a model profile and showcase your portfolio."}
                    onPress={() => { setIntent("model"); setError(null); }}
                    isRtl={isRtl}
                    styles={styles}
                  />
                  <IntentCard
                    active={intent === "publisher"}
                    icon="publisher"
                    title={isArabic ? "أبحث عن مواهب لمشروع" : "I need talent for a project"}
                    body={isArabic ? "أرسل احتياجك وسنساعدك في الوصول إلى المواهب المناسبة." : "Tell us what you need and reach the right talent faster."}
                    onPress={() => { setIntent("publisher"); setError(null); }}
                    isRtl={isRtl}
                    styles={styles}
                  />
                </View>

                {error ? <ErrorBox text={error} textAlign={textAlign} styles={styles} /> : null}

                <Pressable accessibilityRole="button" disabled={!intent} onPress={continueFromIntent} style={({ pressed }) => [styles.primaryButton, !intent && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.primaryText}>{isArabic ? "متابعة" : "Continue"}</Text>
                  <NextIcon size={19} color="#10100E" strokeWidth={2.2} />
                </Pressable>

                <Pressable accessibilityRole="button" onPress={() => router.replace("/login")} style={styles.signinButton}>
                  <Text style={styles.loginLink}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.eyebrow, { textAlign }]}>{isArabic ? "بيانات أساسية فقط" : "JUST THE ESSENTIALS"}</Text>
                  <Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "أنشئ حسابك" : "Create your account"}</Text>
                  <Text style={[styles.subtitle, { textAlign }]}>{accountType === "talent"
                    ? (isArabic ? "بعد تأكيد بريدك سنأخذك خطوة بخطوة لبناء ملفك وإضافة صورتك الرئيسية." : "After email verification, we'll guide you through your profile and primary photo.")
                    : (isArabic ? "بعد تأكيد بريدك سنساعدك في تجهيز احتياجك والوصول للمواهب المناسبة." : "After email verification, we'll help you prepare your brief and reach the right talent.")}</Text>
                </View>

                <View style={[styles.selectionSummary, isRtl && styles.rowRtl]}>
                  <View style={styles.summaryIcon}>{accountType === "publisher" ? <Building2 size={18} color="#C9A962" /> : <UserRound size={18} color="#C9A962" />}</View>
                  <View style={styles.summaryCopy}>
                    <Text style={[styles.summaryCaption, { textAlign }]}>{isArabic ? "مسارك" : "Your path"}</Text>
                    <Text style={[styles.summaryTitle, { textAlign }]}>{intent === "actor" ? (isArabic ? "فرص تمثيل" : "Acting opportunities") : intent === "model" ? (isArabic ? "فرص مودل" : "Modeling opportunities") : (isArabic ? "البحث عن مواهب" : "Find talent")}</Text>
                  </View>
                  <Pressable onPress={() => setStep(1)}><Text style={styles.changeText}>{isArabic ? "تغيير" : "Change"}</Text></Pressable>
                </View>

                <View style={styles.formCard}>
                  <Field required label={accountType === "talent" ? (isArabic ? "الاسم المهني" : "Professional name") : (isArabic ? "اسم مسؤول الحساب" : "Contact name")} value={name} onChangeText={setName} placeholder={isArabic ? "الاسم الكامل" : "Full name"} autoComplete="name" autoCapitalize="words" returnKeyType="next" align={textAlign} direction={isRtl ? "rtl" : "ltr"} styles={styles} />
                  <Field required label={isArabic ? "رقم الجوال" : "Mobile number"} value={phone} onChangeText={setPhone} placeholder="+9665XXXXXXXX" autoComplete="tel" keyboardType="phone-pad" returnKeyType="next" align={textAlign} direction="ltr" styles={styles} />
                  <Field required label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} placeholder="name@example.com" autoComplete="email" autoCapitalize="none" keyboardType="email-address" returnKeyType="next" align={textAlign} direction="ltr" styles={styles} />
                  <Field required label={isArabic ? "كلمة المرور" : "Password"} value={password} onChangeText={setPassword} placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} autoComplete="new-password" autoCapitalize="none" secureTextEntry returnKeyType="next" align={textAlign} direction={isRtl ? "rtl" : "ltr"} styles={styles} />
                  <Field required label={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} value={passwordConfirmation} onChangeText={setPasswordConfirmation} placeholder="••••••••" autoComplete="new-password" autoCapitalize="none" secureTextEntry returnKeyType="done" onSubmitEditing={() => void signUp()} align={textAlign} direction={isRtl ? "rtl" : "ltr"} styles={styles} />
                  <Text style={[styles.requiredLegend, { textAlign }]}>{isArabic ? "* حقل مطلوب" : "* Required field"}</Text>

                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => setAcceptedTerms((current) => !current)} style={[styles.termsRow, isRtl && styles.rowRtl]}>
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>{acceptedTerms ? <Check size={14} color="#10100E" strokeWidth={3} /> : null}</View>
                    <Text style={[styles.termsText, { textAlign }]}>{isArabic ? "أوافق على الشروط وسياسة الخصوصية" : "I agree to the Terms and Privacy Policy"}</Text>
                  </Pressable>
                  <View style={[styles.legalLinks, isRtl && styles.rowRtl]}>
                    <Pressable onPress={() => router.push({ pathname: "/legal", params: { section: "terms" } })}><Text style={styles.legalLink}>{isArabic ? "الشروط" : "Terms"}</Text></Pressable>
                    <Text style={styles.legalDot}>·</Text>
                    <Pressable onPress={() => router.push({ pathname: "/legal", params: { section: "privacy" } })}><Text style={styles.legalLink}>{isArabic ? "الخصوصية" : "Privacy"}</Text></Pressable>
                  </View>

                  {error ? <ErrorBox text={error} textAlign={textAlign} styles={styles} /> : null}

                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void signUp()} style={({ pressed }) => [styles.primaryButton, loading && styles.disabled, pressed && styles.pressed]}>
                    <Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : (isArabic ? "إنشاء الحساب" : "Create account")}</Text>
                    <NextIcon size={19} color="#10100E" strokeWidth={2.2} />
                  </Pressable>

                  <View style={[styles.otpNote, isRtl && styles.rowRtl]}>
                    <Sparkles size={17} color="#C9A962" />
                    <Text style={[styles.otpNoteText, { textAlign }]}>{isArabic ? "بعد الإنشاء سنرسل رمز تحقق من 6 أرقام إلى بريدك. لا حاجة لفتح رابط أو إكمال التسجيل في المتصفح." : "Next, we'll email you a 6-digit verification code. No browser signup handoff required."}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function IntentCard({ active, icon, title, body, onPress, isRtl, styles }: { active: boolean; icon: "actor" | "model" | "publisher"; title: string; body: string; onPress: () => void; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  const Icon = icon === "publisher" ? Building2 : icon === "actor" ? Drama : UserRound;
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.intentCard, active && styles.intentCardActive, pressed && styles.pressed]}>
      <View style={[styles.intentInner, isRtl && styles.rowRtl]}>
        <View style={[styles.intentIcon, active && styles.intentIconActive]}><Icon size={23} color={active ? "#C9A962" : "#E7E5DD"} strokeWidth={1.8} /></View>
        <View style={styles.intentCopy}>
          <Text style={[styles.intentTitle, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text>
          <Text style={[styles.intentBody, { textAlign: isRtl ? "right" : "left" }]}>{body}</Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
      </View>
    </Pressable>
  );
}

function Field({ label, required, align, direction, styles, ...props }: { label: string; required?: boolean; align: "left" | "right"; direction: "ltr" | "rtl"; styles: ReturnType<typeof createStyles> } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { textAlign: align }]}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>
      <TextInput placeholderTextColor="#85857E" style={[styles.input, { textAlign: align, writingDirection: direction }]} {...props} />
    </View>
  );
}

function ErrorBox({ text, textAlign, styles }: { text: string; textAlign: "left" | "right"; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.errorText, { textAlign }]}>{text}</Text></View>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    scrollContent: { flexGrow: 1, paddingBottom: 28 },
    content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 20 },
    topRow: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rowRtl: { flexDirection: "row-reverse" },
    iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#2B2B28", alignItems: "center", justifyContent: "center" },
    brandLogo: { width: 116, height: 38 },
    languageButton: { minWidth: 44, height: 36, paddingHorizontal: 9, borderRadius: 18, borderWidth: 1, borderColor: "#2B2B28", alignItems: "center", justifyContent: "center" },
    languageButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    progressRow: { flexDirection: "row", gap: 7, marginTop: 10 },
    progressSegment: { height: 3, flex: 1, borderRadius: 2, backgroundColor: "#2A2A26" },
    progressActive: { backgroundColor: "#C9A962" },
    stepLabel: { color: "#8F8F88", fontSize: 11, marginTop: 8, width: "100%" },
    header: { paddingTop: 26, paddingBottom: 22 },
    eyebrow: { color: "#C9A962", fontSize: 11, letterSpacing: 1.35, fontWeight: "800", width: "100%", marginBottom: 8 },
    title: { color: theme.text, fontSize: 30, lineHeight: 38, fontWeight: "800", width: "100%" },
    subtitle: { color: "#AAA9A1", fontSize: 14, lineHeight: 22, marginTop: 10, width: "100%" },
    intentList: { gap: 12 },
    intentCard: { borderRadius: 20, borderWidth: 1, borderColor: "#2A2A26", backgroundColor: "#151513", overflow: "hidden" },
    intentCardActive: { borderColor: "#796635", backgroundColor: "#1B1913" },
    intentInner: { minHeight: 104, padding: 16, flexDirection: "row", alignItems: "center", gap: 13 },
    intentIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#20201D", alignItems: "center", justifyContent: "center" },
    intentIconActive: { backgroundColor: "#292316" },
    intentCopy: { flex: 1, gap: 5 },
    intentTitle: { color: theme.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    intentBody: { color: "#9C9B94", fontSize: 12, lineHeight: 18 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#66665F", alignItems: "center", justifyContent: "center" },
    radioActive: { borderColor: "#C9A962" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9A962" },
    selectionSummary: { minHeight: 70, borderRadius: 18, borderWidth: 1, borderColor: "#3F3929", backgroundColor: "#17150F", flexDirection: "row", alignItems: "center", gap: 11, padding: 13, marginBottom: 14 },
    summaryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#292316" },
    summaryCopy: { flex: 1 },
    summaryCaption: { color: "#8F8F88", fontSize: 10 },
    summaryTitle: { color: theme.text, fontSize: 14, fontWeight: "800", marginTop: 2 },
    changeText: { color: "#C9A962", fontSize: 12, fontWeight: "800" },
    formCard: { backgroundColor: "#151513", borderWidth: 1, borderColor: "#292925", borderRadius: 24, padding: 18, gap: 14 },
    fieldWrap: { gap: 7 },
    fieldLabel: { color: theme.text, fontSize: 13, fontWeight: "700", width: "100%" },
    required: { color: "#C9A962" },
    requiredLegend: { color: "#8D8D86", fontSize: 11, marginTop: -4, width: "100%" },
    input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#32322E", backgroundColor: "#0D0D0C", color: theme.text, paddingHorizontal: 14, fontSize: 14 },
    termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
    checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1, borderColor: "#56564F", alignItems: "center", justifyContent: "center" },
    checkboxActive: { backgroundColor: "#C9A962", borderColor: "#C9A962" },
    termsText: { color: "#C8C7C0", fontSize: 12, lineHeight: 18, flex: 1 },
    legalLinks: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
    legalLink: { color: "#C9A962", fontSize: 12, fontWeight: "700" },
    legalDot: { color: "#696963" },
    errorBox: { borderRadius: 14, padding: 12, backgroundColor: "#281718", borderWidth: 1, borderColor: "#5A2C30", marginTop: 4 },
    errorText: { color: "#F2B8B5", fontSize: 13, lineHeight: 20 },
    primaryButton: { minHeight: 54, borderRadius: 16, backgroundColor: "#C9A962", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 18 },
    primaryText: { color: "#10100E", fontSize: 15, fontWeight: "800" },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.82 },
    signinButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 },
    loginLink: { color: "#D8D6CD", fontSize: 13, fontWeight: "700" },
    otpNote: { flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: "#11110F", borderRadius: 14, padding: 12 },
    otpNoteText: { color: "#9D9C94", flex: 1, fontSize: 11, lineHeight: 18 },
  });
}
