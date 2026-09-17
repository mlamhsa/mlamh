import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSessionContext } from "@/src/runtime/SessionContext";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type HomeAction = {
  key: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  href: string;
  icon: typeof Search;
};

const ACTIONS: HomeAction[] = [
  {
    key: "talents",
    titleAr: "اكتشف المواهب",
    titleEn: "Discover talent",
    bodyAr: "ابحث في دليل المواهب المعتمدة وافتح الملفات المناسبة لاحتياجك.",
    bodyEn: "Search approved talent and open profiles that fit your brief.",
    href: "/talents",
    icon: Search,
  },
  {
    key: "messages",
    titleAr: "الرسائل والطلبات",
    titleEn: "Messages & requests",
    bodyAr: "تابع محادثات طلبات الآن والكاستينغ من مكان واحد.",
    bodyEn: "Follow Quick Request and Casting conversations in one place.",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    key: "opportunities",
    titleAr: "فرصي",
    titleEn: "My opportunities",
    bodyAr: "تابع حالة فرصك وعدد المتقدمين عليها من المراجعة حتى النشر والإغلاق.",
    bodyEn: "Track your opportunities and applicant counts from review through publishing and closure.",
    href: "/publisher-opportunities",
    icon: BriefcaseBusiness,
  },
  {
    key: "account",
    titleAr: "الحساب والخصوصية",
    titleEn: "Account & privacy",
    bodyAr: "إدارة الجلسة وخيارات الحساب، بما فيها حذف الحساب نهائيًا من داخل التطبيق.",
    bodyEn: "Manage your session and account controls, including permanent account deletion in the app.",
    href: "/account",
    icon: UserRound,
  },
];

export default function PublisherHomeScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const account = session.status === "publisher" ? session.account : null;
  const capabilities = account?.capabilities;
  const canCreateQuick = Boolean(capabilities?.canCreateQuick);
  const canCreateCasting = Boolean(capabilities?.canCreateCasting);
  const canCreate = Boolean(capabilities?.canCreate);

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "مساحة الناشر" : "PUBLISHER WORKSPACE"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {account?.displayName
            ? isArabic
              ? `مرحبًا، ${account.displayName}`
              : `Welcome, ${account.displayName}`
            : isArabic
              ? "مرحبًا"
              : "Welcome"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic
            ? "ابدأ من قرار واضح: أنشئ طلبًا، اكتشف المواهب، أو تابع المحادثات. صلاحيات الإنشاء تأتي من الخادم ولا تُفترض داخل التطبيق."
            : "Start with a clear decision: create a request, discover talent, or follow conversations. Creation permission always comes from the server."}
        </Text>

        <View style={[styles.statusCard, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <View style={styles.statusIcon}><ShieldCheck size={20} color={colors.gold} /></View>
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
              {account?.verified
                ? (isArabic ? "الجهة موثقة" : "Verified publisher")
                : (isArabic ? "حالة التوثيق مستقلة عن اعتماد الحساب" : "Verification is separate from account approval")}
            </Text>
            <Text style={[styles.statusText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
              {isArabic
                ? `الاعتماد: ${account?.approvalStatus ?? "—"} · التوثيق: ${account?.verificationStatus ?? "unverified"}`
                : `Approval: ${account?.approvalStatus ?? "—"} · Verification: ${account?.verificationStatus ?? "unverified"}`}
            </Text>
          </View>
        </View>

        <View style={styles.capabilitiesRow}>
          <Capability enabled={canCreateQuick} icon={Zap} label={isArabic ? "طلبات الآن" : "Quick"} />
          <Capability enabled={canCreateCasting} icon={BriefcaseBusiness} label={isArabic ? "كاستينغ" : "Casting"} />
        </View>

        {canCreate ? (
          <View style={styles.createSection}>
            <Text style={[styles.sectionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "إنشاء جديد" : "Create new"}</Text>
            <View style={styles.createGrid}>
              <CreateCard
                enabled={canCreateQuick}
                icon={Zap}
                title={isArabic ? "طلب الآن" : "Quick Request"}
                body={isArabic ? "احتياج سريع ومباشر للممثلين أو المودلز." : "A fast, direct Actor or Model need."}
                onPress={() => router.push("/create-opportunity?mode=quick" as never)}
                isArabic={isArabic}
              />
              <CreateCard
                enabled={canCreateCasting}
                icon={BriefcaseBusiness}
                title={isArabic ? "كاستينغ" : "Casting"}
                body={isArabic ? "فرصة أوسع بمراحل اختيار وتفاصيل عمل." : "A structured opportunity with a fuller selection flow."}
                onPress={() => router.push("/create-opportunity?mode=casting" as never)}
                isArabic={isArabic}
              />
            </View>
          </View>
        ) : (
          <View style={styles.notice}>
            <Text style={[styles.noticeText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
              {isArabic
                ? "إنشاء الطلبات غير متاح لهذا الحساب حاليًا. يمكنك الاستمرار في اكتشاف المواهب ومتابعة الرسائل أثناء معالجة حالة الحساب."
                : "Creation is not currently available for this account. You can still discover talent and follow messages while the account status is being resolved."}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => router.push(item.href as never)}
                style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              >
                <View style={[styles.actionRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
                  <View style={styles.actionIcon}><Icon size={21} color={colors.gold} /></View>
                  <View style={styles.actionCopy}>
                    <Text style={[styles.actionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? item.titleAr : item.titleEn}</Text>
                    <Text style={[styles.actionText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? item.bodyAr : item.bodyEn}</Text>
                  </View>
                  <DirectionArrow size={17} color={colors.textMuted} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function Capability({ enabled, icon: Icon, label }: { enabled: boolean; icon: typeof Zap; label: string }) {
  return (
    <View style={[styles.capability, enabled && styles.capabilityEnabled]}>
      <Icon size={16} color={enabled ? colors.gold : colors.textMuted} />
      <Text style={[styles.capabilityText, enabled && styles.capabilityTextEnabled]}>{label}</Text>
      <Text style={styles.capabilityState}>{enabled ? "✓" : "—"}</Text>
    </View>
  );
}

function CreateCard({ enabled, icon: Icon, title, body, onPress, isArabic }: { enabled: boolean; icon: typeof Zap; title: string; body: string; onPress: () => void; isArabic: boolean }) {
  return (
    <Pressable disabled={!enabled} onPress={onPress} style={({ pressed }) => [styles.createCard, enabled && styles.createCardEnabled, !enabled && styles.disabled, pressed && styles.pressed]}>
      <Icon size={20} color={enabled ? colors.gold : colors.textMuted} />
      <Text style={[styles.createTitle, enabled && styles.createTitleEnabled, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{title}</Text>
      <Text style={[styles.createBody, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 56 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  eyebrow: { color: colors.gold, fontSize: typography.eyebrow, letterSpacing: 2.2, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 32, lineHeight: 40, fontWeight: "500", marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 24, marginTop: spacing.md },
  statusCard: { marginTop: spacing.xl, borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.05)", borderRadius: radius.xl, padding: spacing.lg },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.24)" },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  statusText: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 5 },
  capabilitiesRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  capability: { flex: 1, minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg },
  capabilityEnabled: { borderColor: "rgba(201,169,98,0.30)", backgroundColor: "rgba(201,169,98,0.06)" },
  capabilityText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  capabilityTextEnabled: { color: colors.textPrimary },
  capabilityState: { color: colors.gold, fontSize: 12, fontWeight: "800" },
  createSection: { marginTop: spacing.xl },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: spacing.md },
  createGrid: { flexDirection: "row", gap: spacing.md },
  createCard: { flex: 1, minHeight: 136, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  createCardEnabled: { borderColor: "rgba(201,169,98,0.22)" },
  createTitle: { color: colors.textMuted, fontSize: 14, fontWeight: "700", marginTop: spacing.sm },
  createTitleEnabled: { color: colors.textPrimary },
  createBody: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  notice: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md },
  noticeText: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  actions: { gap: spacing.md, marginTop: spacing.xl },
  actionCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  actionRow: { alignItems: "center" },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.06)" },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  actionText: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.994 }] },
  disabled: { opacity: 0.4 },
});
