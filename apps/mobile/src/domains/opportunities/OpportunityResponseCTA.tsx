import { router, type Href } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, LockKeyhole } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MobileApiError } from "@/src/api/client";
import { useSessionContext } from "@/src/app/SessionContext";
import { respondToMobileOpportunity } from "@/src/domains/opportunities/api";
import type { MobilePublicOpportunity } from "@/src/domains/opportunities/types";
import type { AppLocale } from "@/src/i18n/locale";
import { colors, radius, spacing } from "@/src/theme/tokens";

type Props = {
  item: MobilePublicOpportunity;
  locale: AppLocale;
};

type CtaState = {
  label: string;
  note: string;
  enabled: boolean;
  route?: Href;
};

function talentGate(approvalStatus: string | null, postingMode: MobilePublicOpportunity["postingMode"], isArabic: boolean): CtaState {
  if (approvalStatus === "approved") {
    return {
      label: postingMode === "quick"
        ? (isArabic ? "أنا مهتم" : "I'm interested")
        : (isArabic ? "تقدّم الآن" : "Apply now"),
      note: postingMode === "quick"
        ? (isArabic ? "سيبدأ طلب مرتبط بمحادثة داخل ملامح." : "This starts a request-linked conversation inside MLAMH.")
        : (isArabic ? "سيتم إرسال ملفك للجهة للمراجعة." : "Your profile will be submitted for publisher review."),
      enabled: true,
    };
  }

  if (approvalStatus === "submitted" || approvalStatus === "pending") {
    return {
      label: isArabic ? "ملفك قيد المراجعة" : "Profile under review",
      note: isArabic ? "يمكنك التقديم بعد اعتماد ملف الموهبة." : "You can respond after your talent profile is approved.",
      enabled: false,
    };
  }

  if (approvalStatus === "changes_requested") {
    return {
      label: isArabic ? "راجع التعديلات المطلوبة" : "Review requested changes",
      note: isArabic ? "أكمل التعديلات المطلوبة ثم أرسل ملفك للمراجعة مرة أخرى." : "Complete the requested changes and resubmit your profile.",
      enabled: true,
      route: "/(talent)" as Href,
    };
  }

  if (approvalStatus === "rejected") {
    return {
      label: isArabic ? "راجع حالة ملفك" : "Review profile status",
      note: isArabic ? "لا يمكن التقديم بهذا الملف حاليًا." : "This profile cannot respond to opportunities right now.",
      enabled: true,
      route: "/(talent)" as Href,
    };
  }

  return {
    label: isArabic ? "أكمل ملف الموهبة" : "Complete talent profile",
    note: isArabic ? "أكمل ملفك وأرسله للمراجعة قبل التقديم على الفرص." : "Complete and submit your profile for review before responding.",
    enabled: true,
    route: "/(talent)" as Href,
  };
}

function errorMessage(code: string, isArabic: boolean) {
  const ar: Record<string, string> = {
    ALREADY_APPLIED: "سبق لك التفاعل مع هذه الفرصة.",
    TALENT_NOT_APPROVED: "يجب اعتماد ملف الموهبة أولًا.",
    PROFILE_INCOMPLETE: "ملف الموهبة غير مكتمل.",
    ACCOUNT_RESTRICTED: "الحساب غير متاح لهذا الإجراء حاليًا.",
    OPPORTUNITY_NOT_AVAILABLE: "هذه الفرصة لم تعد متاحة.",
    APPLICATION_WINDOW_CLOSED: "انتهت فترة التقديم على هذه الفرصة.",
    RATE_LIMITED: "تم تنفيذ محاولات كثيرة. حاول لاحقًا.",
    QUICK_CONVERSATION_FAILED: "تم تسجيل الاهتمام لكن تعذر فتح المحادثة. حاول مرة أخرى لاحقًا.",
  };
  const en: Record<string, string> = {
    ALREADY_APPLIED: "You already responded to this opportunity.",
    TALENT_NOT_APPROVED: "Your talent profile must be approved first.",
    PROFILE_INCOMPLETE: "Your talent profile is incomplete.",
    ACCOUNT_RESTRICTED: "This account cannot perform this action right now.",
    OPPORTUNITY_NOT_AVAILABLE: "This opportunity is no longer available.",
    APPLICATION_WINDOW_CLOSED: "The application window has closed.",
    RATE_LIMITED: "Too many attempts. Please try again later.",
    QUICK_CONVERSATION_FAILED: "Your interest was recorded, but the conversation could not be opened. Please try again later.",
  };
  return (isArabic ? ar : en)[code] ?? (isArabic ? "تعذر تنفيذ الإجراء. حاول مرة أخرى." : "Unable to complete the action. Please try again.");
}

export function OpportunityResponseCTA({ item, locale }: Props) {
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cta = useMemo<CtaState>(() => {
    if (session.status === "loading") {
      return {
        label: isArabic ? "جارٍ التحقق من حسابك..." : "Checking your account...",
        note: isArabic ? "لحظة واحدة." : "One moment.",
        enabled: false,
      };
    }

    if (session.status === "guest" || session.status === "account_missing") {
      return {
        label: isArabic ? "سجّل للمتابعة" : "Sign in to continue",
        note: isArabic ? "التقديم وإبداء الاهتمام متاحان لحسابات المواهب المؤهلة." : "Applications and interest are available to eligible talent accounts.",
        enabled: true,
        route: "/account-type" as Href,
      };
    }

    if (session.status === "publisher") {
      return {
        label: isArabic ? "هذه الفرصة للمواهب" : "Talent response only",
        note: isArabic ? "حساب الناشر لا يتقدم على الفرص. انتقل لمساحة الناشر لإنشاء طلب أو فرصة." : "Publisher accounts do not apply to opportunities. Use your publisher workspace to create requests or casting opportunities.",
        enabled: true,
        route: "/(publisher)" as Href,
      };
    }

    return talentGate(session.account.approvalStatus, item.postingMode, isArabic);
  }, [isArabic, item.postingMode, session]);

  async function handlePress() {
    if (!cta.enabled || submitting || success) return;
    setFeedback(null);

    if (cta.route) {
      router.push(cta.route);
      return;
    }

    if (session.status !== "talent") return;

    setSubmitting(true);
    try {
      const result = await respondToMobileOpportunity(item.id, locale);
      if (!result.ok) {
        setFeedback(errorMessage(result.code, isArabic));
        return;
      }
      setSuccess(true);
      setFeedback(
        item.postingMode === "quick"
          ? (isArabic ? "تم إرسال اهتمامك وفتح مسار الطلب داخل ملامح." : "Your interest was sent and the request workflow is now open in MLAMH.")
          : (isArabic ? "تم إرسال طلبك للجهة بنجاح." : "Your application was submitted successfully."),
      );
    } catch (error) {
      const code = error instanceof MobileApiError ? error.code : "UNKNOWN";
      setFeedback(errorMessage(code, isArabic));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successCard}>
        <CheckCircle2 size={21} color={colors.success} />
        <View style={styles.flexOne}>
          <Text style={[styles.successTitle, { textAlign: isArabic ? "right" : "left" }]}>
            {item.postingMode === "quick"
              ? (isArabic ? "تم إرسال اهتمامك" : "Interest sent")
              : (isArabic ? "تم التقديم" : "Application submitted")}
          </Text>
          {feedback ? <Text style={[styles.successText, { textAlign: isArabic ? "right" : "left" }]}>{feedback}</Text> : null}
        </View>
      </View>
    );
  }

  const DisabledIcon = session.status === "talent" && !cta.enabled ? Clock3 : LockKeyhole;

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        disabled={!cta.enabled || submitting}
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.cta,
          !cta.enabled && styles.ctaDisabled,
          pressed && cta.enabled && styles.pressed,
        ]}
      >
        {!cta.enabled ? <DisabledIcon size={17} color={colors.textMuted} /> : null}
        <Text style={[styles.ctaText, !cta.enabled && styles.ctaTextDisabled]}>
          {submitting ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : cta.label}
        </Text>
        {cta.enabled && !submitting ? <DirectionArrow size={18} color="#090909" /> : null}
      </Pressable>
      <Text style={styles.note}>{feedback ?? cta.note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.xl },
  flexOne: { flex: 1 },
  cta: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  ctaDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  ctaText: { color: "#090909", fontSize: 15, fontWeight: "800", textAlign: "center" },
  ctaTextDisabled: { color: colors.textMuted },
  note: { color: "rgba(255,255,255,0.38)", fontSize: 10, lineHeight: 17, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.994 }] },
  successCard: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(81,196,121,0.24)",
    backgroundColor: "rgba(81,196,121,0.07)",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  successTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  successText: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 4 },
});
