import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Phone, UserRound } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type AccountType = "talent" | "publisher";
type SignupIntent = "actor" | "model" | "publisher";

type ApiResult = { ok?: boolean; code?: string };

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  return `+${trimmed.replace(/\D/g, "")}`;
}

function isValidPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

async function postJson(accessToken: string, path: string, body: unknown) {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text().catch(() => "");
  let result: ApiResult = {};
  try { result = raw ? JSON.parse(raw) as ApiResult : {}; } catch { result = {}; }
  return { response, result };
}

export default function CompleteAccountScreen() {
  const params = useLocalSearchParams<{ accountType?: string; intent?: string }>();
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = useMemo(() => createStyles(), []);

  const accountType: AccountType = params.accountType === "publisher" ? "publisher" : "talent";
  const intent: SignupIntent | null = params.intent === "actor" || params.intent === "model" || params.intent === "publisher" ? params.intent : null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      const metadata = user?.user_metadata ?? {};
      setName(String(metadata.full_name ?? metadata.name ?? metadata.display_name ?? metadata.contact_name ?? "").trim());
      setPhone(String(metadata.phone ?? "").trim());
      setEmail(user?.email ?? "");
      setLoadingUser(false);
    }
    void hydrate();
    return () => { active = false; };
  }, []);

  async function saveAndContinue() {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedPhone = normalizePhone(phone);
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError(isArabic ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setError(isArabic ? "أدخل رقم جوال دوليًا صحيحًا، مثل +9665XXXXXXXX." : "Enter a valid international mobile number, for example +9665XXXXXXXX.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const accountAttempt = await postJson(session.access_token, "/api/account/details", {
        displayName: normalizedName,
        phone: normalizedPhone,
        accountType,
      });
      if (!accountAttempt.response.ok || !accountAttempt.result.ok) {
        setError(accountAttempt.result.code === "ACCOUNT_TYPE_CONFLICT"
          ? (isArabic ? "هذا الحساب مرتبط بنوع حساب مختلف." : "This account is linked to a different account type.")
          : (isArabic ? "تعذر حفظ بيانات حسابك. حاول مرة أخرى." : "We could not save your account details. Try again."));
        return;
      }

      if (accountType === "publisher") {
        router.replace("/publisher/setup");
        return;
      }

      if (intent === "actor" || intent === "model") {
        const talentAttempt = await postJson(session.access_token, "/api/talent/onboarding", { talentType: intent });
        if (!talentAttempt.response.ok || !talentAttempt.result.ok) {
          setError(isArabic ? "تم حفظ بيانات الحساب، لكن تعذر بدء ملف الموهبة. حاول مرة أخرى." : "Your account details were saved, but we could not start your talent profile. Try again.");
          return;
        }
        router.replace("/profile/journey");
        return;
      }

      router.replace("/onboarding");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من اتصالك وحاول مرة أخرى." : "We could not reach MLAMH. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const textAlign = isRtl ? "right" : "left";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={[styles.topRow, isRtl && styles.rowRtl]}>
              <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.iconButton}>
                <BackIcon size={22} color={darkTheme.text} strokeWidth={1.8} />
              </Pressable>
              <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
              <View style={styles.iconSpacer} />
            </View>

            <View style={[styles.progressRow, isRtl && styles.rowRtl]}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
            <Text style={[styles.stepLabel, { textAlign }]}>{isArabic ? "الخطوة 2 من 5" : "Step 2 of 5"}</Text>

            <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
              <Text style={[styles.eyebrow, { textAlign }]}>{isArabic ? "بيانات حسابك" : "YOUR ACCOUNT"}</Text>
              <Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "أكمل بياناتك الأساسية" : "Complete your account details"}</Text>
              <Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "نحتاج هذه البيانات مرة واحدة فقط. رقم الجوال مطلوب للتواصل، وسيكون جاهزًا للتحقق عبر SMS مستقبلًا." : "We only need these details once. Your mobile number is required for contact and future SMS verification."}</Text>
            </View>

            {loadingUser ? (
              <View style={styles.loadingCard}><ActivityIndicator color={darkTheme.accent} /></View>
            ) : (
              <View style={styles.card}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.label, { textAlign }]}>{isArabic ? "الاسم" : "Name"}<Text style={styles.required}> *</Text></Text>
                  <View style={[styles.inputShell, isRtl && styles.rowRtl]}>
                    <UserRound size={18} color={darkTheme.muted} />
                    <TextInput autoComplete="name" autoCapitalize="words" value={name} onChangeText={(value) => { setName(value); setError(null); }} placeholder={isArabic ? "الاسم الكامل" : "Full name"} placeholderTextColor="#777770" style={[styles.input, { textAlign, writingDirection: isRtl ? "rtl" : "ltr" }]} />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.label, { textAlign }]}>{isArabic ? "رقم الجوال" : "Mobile number"}<Text style={styles.required}> *</Text></Text>
                  <View style={[styles.inputShell, isRtl && styles.rowRtl]}>
                    <Phone size={18} color={darkTheme.muted} />
                    <TextInput autoComplete="tel" keyboardType="phone-pad" value={phone} onChangeText={(value) => { setPhone(value); setError(null); }} placeholder="+9665XXXXXXXX" placeholderTextColor="#777770" style={[styles.input, { textAlign: "left", writingDirection: "ltr" }]} />
                  </View>
                  <Text style={[styles.helper, { textAlign }]}>{isArabic ? "استخدم الصيغة الدولية مثل +9665XXXXXXXX" : "Use international format, for example +9665XXXXXXXX"}</Text>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.label, { textAlign }]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
                  <View style={styles.readonlyField}><Text selectable style={styles.readonlyText}>{email || "—"}</Text><CheckCircle2 size={17} color="#8DBA8B" /></View>
                </View>

                <Text style={[styles.requiredLegend, { textAlign }]}>{isArabic ? "* حقل مطلوب" : "* Required field"}</Text>

                {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.errorText, { textAlign }]}>{error}</Text></View> : null}

                <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => void saveAndContinue()} style={({ pressed }) => [styles.primaryButton, saving && styles.disabled, pressed && styles.pressed]}>
                  {saving ? <ActivityIndicator color="#10100E" /> : <Text style={styles.primaryText}>{isArabic ? "حفظ ومتابعة" : "Save and continue"}</Text>}
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles() {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: darkTheme.background },
    scrollContent: { flexGrow: 1, paddingBottom: 28 },
    content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 20 },
    topRow: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rowRtl: { flexDirection: "row-reverse" },
    iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#2B2B28", alignItems: "center", justifyContent: "center" },
    iconSpacer: { width: 42, height: 42 },
    brand: { color: darkTheme.accent, fontSize: 17, fontWeight: "900", letterSpacing: 1.5 },
    progressRow: { flexDirection: "row", gap: 6, marginTop: 10 },
    progressSegment: { height: 3, flex: 1, borderRadius: 2, backgroundColor: "#2A2A26" },
    progressActive: { backgroundColor: darkTheme.accent },
    stepLabel: { color: "#8F8F88", fontSize: 11, marginTop: 8, width: "100%" },
    header: { paddingTop: 26, paddingBottom: 22 },
    eyebrow: { color: darkTheme.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, width: "100%", marginBottom: 8 },
    title: { color: darkTheme.text, fontSize: 30, lineHeight: 38, fontWeight: "800", width: "100%" },
    subtitle: { color: "#AAA9A1", fontSize: 14, lineHeight: 22, marginTop: 10, width: "100%" },
    loadingCard: { minHeight: 180, borderWidth: 1, borderColor: "#292925", borderRadius: 22, backgroundColor: "#151513", alignItems: "center", justifyContent: "center" },
    card: { backgroundColor: "#151513", borderWidth: 1, borderColor: "#292925", borderRadius: 24, padding: 18, gap: 15 },
    fieldWrap: { gap: 7 },
    label: { color: darkTheme.text, fontSize: 13, fontWeight: "700", width: "100%" },
    required: { color: darkTheme.accent },
    requiredLegend: { color: "#8D8D86", fontSize: 11, marginTop: -3, width: "100%" },
    helper: { color: "#85857E", fontSize: 11, lineHeight: 17, width: "100%" },
    inputShell: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#32322E", backgroundColor: "#0D0D0C", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13 },
    input: { flex: 1, color: darkTheme.text, fontSize: 14, paddingVertical: 12 },
    readonlyField: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#2C332C", backgroundColor: "#0F130F", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 13 },
    readonlyText: { flex: 1, color: "#C9C9C2", fontSize: 14, textAlign: "left", writingDirection: "ltr" },
    errorBox: { borderRadius: 14, padding: 12, backgroundColor: "#281718", borderWidth: 1, borderColor: "#5A2C30" },
    errorText: { color: "#F2B8B5", fontSize: 13, lineHeight: 20 },
    primaryButton: { minHeight: 54, borderRadius: 16, backgroundColor: darkTheme.accent, alignItems: "center", justifyContent: "center", marginTop: 4 },
    primaryText: { color: "#10100E", fontSize: 15, fontWeight: "800" },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.82 },
  });
}
