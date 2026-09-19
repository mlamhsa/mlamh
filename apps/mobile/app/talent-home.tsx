import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSessionContext } from "@/src/runtime/SessionContext";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type Action = {
  key: string;
  href: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  icon: typeof BriefcaseBusiness;
};

const ACTIONS: Action[] = [
  {
    key: "opportunities",
    href: "/opportunities",
    titleAr: "اكتشف الفرص",
    titleEn: "Discover opportunities",
    bodyAr: "طلبات الآن والكاستينغ في مكان واحد، مع فصل واضح بين المسارين.",
    bodyEn: "Quick Requests and Casting in one place, with each workflow kept distinct.",
    icon: BriefcaseBusiness,
  },
  {
    key: "applications",
    href: "/applications",
    titleAr: "طلباتي",
    titleEn: "My applications",
    bodyAr: "تابع اهتماماتك وطلبات الكاستينغ وحالة كل طلب كما هي فعليًا.",
    bodyEn: "Track Quick interests, Casting applications, and their real product states.",
    icon: ClipboardList,
  },
  {
    key: "messages",
    href: "/messages",
    titleAr: "الرسائل",
    titleEn: "Messages",
    bodyAr: "أكمل طلبات الآن والمحادثات التي فُتحت بعد الاختيار من داخل ملامح.",
    bodyEn: "Continue Quick workflows and conversations opened after selection inside MLAMH.",
    icon: MessageCircle,
  },
  {
    key: "scene",
    href: "/scene",
    titleAr: "مشهد ملامح",
    titleEn: "MLAMH Scene",
    bodyAr: "اكتشف محتوى يساعدك على فهم المجال والفرص وصناعة ملف أفضل.",
    bodyEn: "Discover content that helps you understand the industry, opportunities, and stronger profiles.",
    icon: BookOpen,
  },
  {
    key: "account",
    href: "/account",
    titleAr: "الحساب والخصوصية",
    titleEn: "Account & privacy",
    bodyAr: "إدارة الجلسة وخيارات الحساب، بما فيها حذف الحساب نهائيًا من داخل التطبيق.",
    bodyEn: "Manage your session and account controls, including permanent account deletion in the app.",
    icon: UserRound,
  },
];

function statusContent(status: string | null, isArabic: boolean) {
  if (status === "approved") {
    return {
      icon: CheckCircle2,
      title: isArabic ? "ملفك معتمد" : "Your profile is approved",
      body: isArabic
        ? "يمكنك الآن التفاعل مع الفرص ومتابعة طلباتك ومحادثاتك من التطبيق."
        : "You can now respond to opportunities and manage your applications and conversations in the app.",
      tone: "success" as const,
    };
  }

  if (status === "under_review" || status === "submitted" || status === "pending") {
    return {
      icon: Clock3,
      title: isArabic ? "ملفك قيد المراجعة" : "Your profile is under review",
      body: isArabic
        ? "يمكنك تصفح الفرص والمحتوى الآن، وسيُفتح التقديم بعد اعتماد الملف."
        : "You can browse opportunities and content now. Responding unlocks after approval.",
      tone: "review" as const,
    };
  }

  if (status === "changes_requested") {
    return {
      icon: ShieldAlert,
      title: isArabic ? "توجد تعديلات مطلوبة" : "Changes are required",
      body: isArabic
        ? "راجع حالة ملفك وأكمل المطلوب قبل إعادة الإرسال للمراجعة."
        : "Review your profile status and complete the requested changes before resubmitting.",
      tone: "warning" as const,
    };
  }

  if (status === "rejected") {
    return {
      icon: ShieldAlert,
      title: isArabic ? "راجع حالة ملفك" : "Review your profile status",
      body: isArabic
        ? "التقديم غير متاح بهذا الملف حاليًا، لكن يمكنك الاستمرار في تصفح الفرص وScene."
        : "Applications are not available for this profile right now, but you can keep browsing opportunities and Scene.",
      tone: "warning" as const,
    };
  }

  return {
    icon: Sparkles,
    title: isArabic ? "ابدأ بملف موهبة مكتمل" : "Start with a complete talent profile",
    body: isArabic
      ? "تصفح المنصة الآن، وأكمل ملفك عندما تكون جاهزًا لإرساله للمراجعة."
      : "Browse MLAMH now and complete your profile when you are ready to submit it for review.",
    tone: "neutral" as const,
  };
}

export default function TalentHomeScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const account = session.status === "talent" ? session.account : null;
  const status = statusContent(account?.approvalStatus ?? null, isArabic);
  const StatusIcon = status.icon;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic ? "مساحة الموهبة" : "TALENT WORKSPACE"}
        </Text>
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
            ? "كل ما تحتاجه الآن: اكتشف فرصة، تابع طلباتك، وأكمل محادثاتك بدون خلط بين طلبات الآن والكاستينغ."
            : "Everything you need now: discover an opportunity, track applications, and continue conversations without mixing Quick Requests with Casting."}
        </Text>

        <View
          style={[
            styles.statusCard,
            status.tone === "success" && styles.statusSuccess,
            status.tone === "warning" && styles.statusWarning,
            status.tone === "review" && styles.statusReview,
          ]}
        >
          <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
            <View style={styles.statusIcon}>
              <StatusIcon size={20} color={colors.gold} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.statusTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{status.title}</Text>
              <Text style={[styles.statusBody, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{status.body}</Text>
            </View>
          </View>
          <Text style={[styles.statusMeta, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic
              ? `الحالة: ${account?.approvalStatus ?? "غير مكتمل"}`
              : `Status: ${account?.approvalStatus ?? "incomplete"}`}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic ? "ابدأ من هنا" : "Start here"}
        </Text>

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
                <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
                  <View style={styles.actionIcon}>
                    <Icon size={21} color={colors.gold} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.actionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                      {isArabic ? item.titleAr : item.titleEn}
                    </Text>
                    <Text style={[styles.actionBody, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                      {isArabic ? item.bodyAr : item.bodyEn}
                    </Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 64,
  },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flexOne: { flex: 1 },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 2.2,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  statusCard: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  statusSuccess: {
    borderColor: "rgba(81,196,121,0.24)",
    backgroundColor: "rgba(81,196,121,0.06)",
  },
  statusWarning: {
    borderColor: "rgba(201,169,98,0.28)",
    backgroundColor: "rgba(201,169,98,0.06)",
  },
  statusReview: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
  },
  statusTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  statusBody: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 4,
  },
  statusMeta: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 9,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.md },
  actionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
    backgroundColor: "rgba(201,169,98,0.06)",
  },
  actionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  actionBody: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.994 }] },
});
