import { useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type AccountType = "talent" | "publisher";

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  return `+${trimmed.replace(/\D/g, "")}`;
}

function isValidPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export default function SignupScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [accountType, setAccountType] = useState<AccountType>("talent");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextPath = accountType === "publisher" ? "/publisher/setup" : "/onboarding";
  const nativeRedirect = accountType === "publisher" ? "mlamh://publisher/setup" : "mlamh://onboarding";

  async function signUp() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedPhone = normalizePhone(phone);
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError(isArabic ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
      return;
    }
    if (!normalizedEmail) {
      setError(isArabic ? "أدخل بريدك الإلكتروني." : "Enter your email address.");
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setError(isArabic ? "أدخل رقم جوال دوليًا صحيحًا، مثل +9665XXXXXXXX." : "Enter a valid international mobile number, for example +9665XXXXXXXX.");
      return;
    }
    if (password.length < 8) {
      setError(isArabic ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Your password must contain at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError(isArabic ? "وافق على الشروط وسياسة الخصوصية للمتابعة." : "Accept the Terms and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
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
        setError(normalized.includes("already")
          ? (isArabic ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول." : "An account already exists with this email. Try signing in.")
          : (isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check the details and try again."));
        return;
      }
      if (data.session) {
        router.replace(nextPath);
        return;
      }
      setMessage(isArabic
        ? `تم إنشاء الحساب. افتح رسالة التأكيد من هذا الجهاز؛ بعد التأكيد سيعيدك الرابط إلى ملامح لإكمال ${accountType === "publisher" ? "إعداد الناشر" : "ملفك المهني"}.`
        : `Account created. Open the confirmation email on this device; the link will return you to MLAMH to finish ${accountType === "publisher" ? "publisher setup" : "your professional profile"}.`);
    } catch {
      setError(isArabic ? "تعذر إنشاء الحساب الآن. تحقق من اتصالك وحاول مرة أخرى." : "Unable to create your account right now. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={[styles.topRow, isRtl && styles.topRowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={[styles.backIcon, isRtl && styles.backIconRtl]}>‹</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{isArabic ? "انضم إلى ملامح" : "JOIN MLAMH"}</Text>
          <Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "ابدأ بالحساب المناسب لك" : "Start with the account that fits you"}</Text>
          <Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "حساب واحد واضح من البداية، وتجربة مهيأة للمواهب والناشرين على iOS وAndroid." : "One clear starting point, designed for both talent and publishers on iOS and Android."}</Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.accountTypeRow}>
          <AccountTypeCard active={accountType === "talent"} title={isArabic ? "موهبة" : "Talent"} body={isArabic ? "ممثل أو مودل يبحث عن فرص" : "Actor or model looking for opportunities"} onPress={() => setAccountType("talent")} styles={styles} />
          <AccountTypeCard active={accountType === "publisher"} title={isArabic ? "ناشر" : "Publisher"} body={isArabic ? "فرد أو جهة تنشر فرصًا" : "Individual or organization publishing opportunities"} onPress={() => setAccountType("publisher")} styles={styles} />
        </View>

        <View style={styles.form}>
          <Label text={accountType === "talent" ? (isArabic ? "الاسم المهني" : "Professional name") : (isArabic ? "اسم مسؤول الحساب" : "Contact name")} styles={styles} align={textAlign} />
          <TextInput accessibilityLabel={accountType === "talent" ? (isArabic ? "الاسم المهني" : "Professional name") : (isArabic ? "اسم مسؤول الحساب" : "Contact name")} autoCapitalize="words" autoComplete="name" returnKeyType="next" placeholder={isArabic ? "الاسم الكامل" : "Full name"} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.input, { textAlign }]} />
          <Label text={isArabic ? "رقم الجوال" : "Mobile number"} styles={styles} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "رقم الجوال" : "Mobile number"} autoComplete="tel" keyboardType="phone-pad" returnKeyType="next" placeholder="+9665XXXXXXXX" placeholderTextColor={theme.muted} value={phone} onChangeText={setPhone} style={[styles.input, { textAlign }]} />
          <Label text={isArabic ? "البريد الإلكتروني" : "Email"} styles={styles} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder="name@example.com" placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={[styles.input, { textAlign }]} />
          <Label text={isArabic ? "كلمة المرور" : "Password"} styles={styles} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} autoCapitalize="none" autoComplete="new-password" secureTextEntry returnKeyType="next" placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={[styles.input, { textAlign }]} />
          <Label text={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} styles={styles} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} autoCapitalize="none" autoComplete="new-password" secureTextEntry returnKeyType="done" placeholder="••••••••" placeholderTextColor={theme.muted} value={passwordConfirmation} onChangeText={setPasswordConfirmation} style={[styles.input, { textAlign }]} onSubmitEditing={() => void signUp()} />

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => setAcceptedTerms((value) => !value)} style={[styles.termsRow, isRtl && styles.termsRowRtl]}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>{acceptedTerms ? <Text style={styles.check}>✓</Text> : null}</View>
            <Text style={[styles.termsText, { textAlign }]}>{isArabic ? "أوافق على الشروط وسياسة الخصوصية" : "I agree to the Terms and Privacy Policy"}</Text>
          </Pressable>
          <View style={[styles.legalLinks, isRtl && styles.legalLinksRtl]}>
            <Pressable onPress={() => void Linking.openURL(`https://mlamh.net/${locale}/terms`)}><Text style={styles.legalLink}>{isArabic ? "الشروط" : "Terms"}</Text></Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => void Linking.openURL(`https://mlamh.net/${locale}/privacy`)}><Text style={styles.legalLink}>{isArabic ? "الخصوصية" : "Privacy"}</Text></Pressable>
          </View>

          {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { textAlign }]}>{error}</Text></View> : null}
          {message ? <View style={styles.successBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.success, { textAlign }]}>{message}</Text></View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading || Boolean(message), busy: loading }} disabled={loading || Boolean(message)} onPress={() => void signUp()} style={({ pressed }) => [styles.primaryButton, (loading || Boolean(message)) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : accountType === "publisher" ? (isArabic ? "إنشاء حساب ناشر" : "Create publisher account") : (isArabic ? "إنشاء حساب موهبة" : "Create talent account")}</Text></Pressable>
          <Text style={styles.freeNote}>{accountType === "talent" ? (isArabic ? "الانضمام والتقديم على الفرص مجاني" : "Free to join and apply to opportunities") : (isArabic ? "يمكنك تجهيز حساب الناشر قبل الاعتماد" : "You can prepare your publisher account before approval")}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/login")}><Text style={styles.loginLink}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function AccountTypeCard({ active, title, body, onPress, styles }: { active: boolean; title: string; body: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.accountTypeCard, active && styles.accountTypeCardActive]}><View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View><Text style={styles.accountTypeTitle}>{title}</Text><Text style={styles.accountTypeBody}>{body}</Text></Pressable>;
}
function Label({ text, styles, align }: { text: string; styles: ReturnType<typeof createStyles>; align: "left" | "right" }) { return <Text style={[styles.fieldLabel, { textAlign: align }]}>{text}</Text>; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, paddingVertical: Platform.OS === "ios" ? 22 : 18 }, content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 34, gap: 24 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, topRowRtl: { flexDirection: "row-reverse" }, backIcon: { color: theme.text, fontSize: 31, lineHeight: 34 }, backIconRtl: { transform: [{ rotate: "180deg" }] }, brand: { color: theme.accent, fontSize: 18, lineHeight: 24, fontWeight: "800", letterSpacing: 1.2 },
  header: { gap: 8 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22, maxWidth: 470 },
  accountTypeRow: { flexDirection: "row", gap: 10 }, accountTypeCard: { flex: 1, minHeight: 126, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, padding: 14, gap: 6 }, accountTypeCardActive: { borderColor: theme.accent, backgroundColor: theme.chip }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: theme.muted, alignItems: "center", justifyContent: "center", marginBottom: 3 }, radioActive: { borderColor: theme.accent }, radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }, accountTypeTitle: { color: theme.text, fontSize: 17, fontWeight: "800" }, accountTypeBody: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  form: { gap: 9 }, fieldLabel: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 3 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 11, fontSize: 15, minHeight: 50 },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }, termsRowRtl: { flexDirection: "row-reverse" }, checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, checkboxActive: { borderColor: theme.accent, backgroundColor: theme.accent }, check: { color: theme.background, fontSize: 13, fontWeight: "900" }, termsText: { flex: 1, color: theme.text, fontSize: 12, lineHeight: 18 }, legalLinks: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, legalLinksRtl: { flexDirection: "row-reverse" }, legalLink: { color: theme.accent, fontSize: 11, fontWeight: "700" }, legalDot: { color: theme.muted, fontSize: 11 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, successBox: { borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.chip, borderRadius: 12, padding: 12 }, success: { color: theme.text, fontSize: 13, lineHeight: 20 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 7 }, primaryText: { color: theme.background, fontSize: 15, fontWeight: "800" }, freeNote: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 2 }, loginLink: { color: theme.text, textAlign: "center", fontSize: 13, paddingVertical: 8, fontWeight: "600" }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 },
}); }
