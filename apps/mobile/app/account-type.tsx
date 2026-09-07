import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Building2, UserRound } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");

type AccountType = "talent" | "publisher";

export default function AccountTypeScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      const account = await getMobileAccountContext().catch(() => null);
      if (!active) return;
      const home = getAccountHomeHref(account);
      if (home) {
        router.replace(home);
        return;
      }
      const metadataType = session.user.user_metadata?.account_type;
      if (metadataType === "publisher") {
        router.replace("/publisher/setup");
        return;
      }
      if (metadataType === "talent") {
        router.replace("/onboarding");
        return;
      }
      setChecking(false);
    })();
    return () => { active = false; };
  }, []);

  const textAlign = isRtl ? "right" : "left";
  const brandSource = isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN;

  async function continueWithRole() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { account_type: selected, preferred_locale: locale },
      });
      if (updateError) {
        setError(isArabic ? "تعذر حفظ نوع الحساب. حاول مرة أخرى." : "Unable to save your account type. Please try again.");
        return;
      }
      router.replace(selected === "publisher" ? "/publisher/setup" : "/onboarding");
    } catch {
      setError(isArabic ? "تعذر حفظ نوع الحساب. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save your account type. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}><View style={styles.loading}><Image source={brandSource} resizeMode="contain" style={styles.loadingLogo} /></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Image source={brandSource} resizeMode="contain" style={styles.brandLogo} />
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "English" : "العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={styles.languageButton}><Text style={[styles.languageText, isArabic && styles.arabicText]}>{isArabic ? "EN" : "العربية"}</Text></Pressable>
        </View>

        <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.eyebrow, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "خطوة واحدة قبل البدء" : "ONE STEP TO START"}</Text>
          <Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "كيف ستستخدم ملامح؟" : "How will you use MLAMH?"}</Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "اختر نوع حسابك لنجهّز لك التجربة المناسبة. يثبت نوع الحساب عند إكمال الإعداد." : "Choose your account type so we can prepare the right experience. Your role is finalized when setup is completed."}</Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.cards}>
          <RoleCard type="talent" selected={selected === "talent"} title={isArabic ? "موهبة" : "Talent"} body={isArabic ? "ممثل أو مودل يريد بناء ملف مهني والتقديم على الفرص." : "Actor or model building a professional profile and applying to opportunities."} onPress={() => { setSelected("talent"); setError(null); }} isRtl={isRtl} styles={styles} />
          <RoleCard type="publisher" selected={selected === "publisher"} title={isArabic ? "ناشر" : "Publisher"} body={isArabic ? "فرد أو جهة تريد نشر الفرص واستقبال المتقدمين." : "Individual or organization publishing opportunities and receiving applicants."} onPress={() => { setSelected("publisher"); setError(null); }} isRtl={isRtl} styles={styles} />
        </View>

        {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={[styles.errorText, isArabic && styles.arabicText, { textAlign }]}>{error}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !selected || saving, busy: saving }} disabled={!selected || saving} onPress={() => void continueWithRole()} style={({ pressed }) => [styles.primaryButton, (!selected || saving) && styles.primaryButtonDisabled, pressed && selected && !saving && styles.pressed]}><Text style={[styles.primaryButtonText, isArabic && styles.arabicText]}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "متابعة" : "Continue")}</Text></Pressable>
        <Text style={[styles.note, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "إذا كان لديك حساب قائم بالفعل، سيستخدم ملامح نوع حسابك الحالي تلقائيًا." : "If you already have an MLAMH account, your existing account type is used automatically."}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function RoleCard({ type, selected, title, body, onPress, isRtl, styles }: { type: AccountType; selected: boolean; title: string; body: string; onPress: () => void; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  const Icon = type === "talent" ? UserRound : Building2;
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}>
    <View style={[styles.cardRow, isRtl && styles.rowRtl]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}><Icon size={24} color={selected ? "#C9A962" : "#F5F5F0"} strokeWidth={1.8} /></View>
      <View style={styles.cardCopy}><Text style={[styles.cardTitle, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{title}</Text><Text style={[styles.cardBody, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{body}</Text></View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </View>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingLogo: { width: 146, height: 56 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { width: "100%", maxWidth: 540, alignSelf: "center", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, gap: 24 },
  topRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  rowRtl: { flexDirection: "row-reverse" },
  brandLogo: { width: 142, height: 50 },
  languageButton: { minWidth: 44, height: 40, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
  languageText: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  header: { gap: 8 },
  eyebrow: { color: theme.accent, fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 34, lineHeight: 42, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23, maxWidth: 470 },
  cards: { gap: 12 },
  card: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface, padding: 16 },
  cardSelected: { borderColor: "#C9A96288", backgroundColor: "#C9A9620D" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  iconWrapSelected: { borderColor: "#C9A96266", backgroundColor: "#C9A96212" },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { color: theme.text, fontSize: 17, lineHeight: 23, fontWeight: "800" },
  cardBody: { color: theme.muted, fontSize: 12, lineHeight: 19 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: theme.accent },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.accent },
  errorCard: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 },
  errorText: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
  primaryButton: { minHeight: 54, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonDisabled: { opacity: 0.35 },
  primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "900" },
  note: { color: theme.muted, fontSize: 11, lineHeight: 18 },
  pressed: { opacity: 0.72 },
  arabicText: { letterSpacing: 0, writingDirection: "rtl" },
}); }
