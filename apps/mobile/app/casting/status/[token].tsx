import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams } from "expo-router";
import { BriefcaseBusiness, ExternalLink, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function CastingStatusBridgeScreen() {
  const params = useLocalSearchParams<{ token?: string | string[]; payment?: string | string[]; claim?: string | string[] }>();
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const payment = Array.isArray(params.payment) ? params.payment[0] : params.payment;
  const claim = Array.isArray(params.claim) ? params.claim[0] : params.claim;
  const validToken = typeof token === "string" && token.length >= 16 && token.length <= 100 && /^[A-Za-z0-9-]+$/.test(token);

  async function openWorkspace() {
    if (!validToken) return;
    const url = new URL(`https://mlamh.net/${locale}/casting/status/${encodeURIComponent(token!)}`);
    if (payment) url.searchParams.set("payment", payment);
    if (claim) url.searchParams.set("claim", claim);
    await WebBrowser.openBrowserAsync(url.toString());
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.icon}><BriefcaseBusiness size={26} color={colors.gold} /></View>
        <Text style={[styles.eyebrow, { textAlign: isArabic ? "right" : "left" }]}>كاستينغ ملامح</Text>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic ? "مساحة مشروع الكاستينغ" : "Casting project workspace"}
        </Text>
        <Text style={[styles.body, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {validToken
            ? (isArabic ? "تحتوي مساحة المشروع على الحالة، والقائمة المختصرة، والاختيارات، والحجوزات، والمدفوعات، والملفات المشتركة. تُفتح داخل نافذة آمنة من ملامح حتى تبقى جميع أدوات المشروع متاحة." : "Your project workspace contains status, shortlist decisions, bookings, payments, and shared files. It opens in a secure MLAMH browser so all project tools remain available.")
            : (isArabic ? "رابط مساحة المشروع غير صالح أو ناقص." : "This project workspace link is invalid or incomplete.")}
        </Text>
        <View style={[styles.secureRow, isArabic && styles.rowReverse]}>
          <ShieldCheck size={15} color={colors.gold} />
          <Text style={styles.secureText}>{isArabic ? "رابط خاص بالمشروع" : "Private project link"}</Text>
        </View>
        {validToken ? (
          <Pressable onPress={() => void openWorkspace()} style={styles.button}>
            <ExternalLink size={17} color="#080808" />
            <Text style={styles.buttonText}>{isArabic ? "فتح مساحة المشروع" : "Open project workspace"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center", paddingHorizontal: spacing.lg },
  card: { borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.05)", borderRadius: 28, padding: spacing.xl },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.08)", marginBottom: spacing.lg },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 28, lineHeight: 36, fontWeight: "700", marginTop: spacing.sm },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 23, marginTop: spacing.md },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: spacing.lg },
  rowReverse: { flexDirection: "row-reverse", alignSelf: "flex-end" },
  secureText: { color: colors.gold, fontSize: 11 },
  button: { minHeight: 52, marginTop: spacing.xl, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: colors.goldSoft },
  buttonText: { color: "#080808", fontSize: 13, fontWeight: "800" },
});
