import { router } from "expo-router";
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileApiError } from "@/src/api/client";
import { deleteMobileAccount } from "@/src/domains/account/api";
import { useLocale } from "@/src/i18n/LocaleProvider";
import {
  hasAppleIdentity,
  requestAppleDeletionAuthorizationCode,
} from "@/src/native/apple-auth";
import { signOutMobile } from "@/src/native/push";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function deletionErrorMessage(error: unknown, isArabic: boolean) {
  const code = error instanceof MobileApiError ? error.code : "UNKNOWN";

  switch (code) {
    case "APPLE_REAUTH_REQUIRED":
      return isArabic
        ? "يلزم تأكيد حساب Apple قبل حذف الحساب. حاول مرة أخرى."
        : "Apple confirmation is required before deleting this account. Please try again.";
    case "APPLE_REVOCATION_CONFIG_MISSING":
      return isArabic
        ? "تعذر إكمال حذف حساب Apple حاليًا. حاول لاحقًا أو تواصل مع الدعم."
        : "Apple account deletion is temporarily unavailable. Please try again later or contact support.";
    case "APPLE_TOKEN_EXCHANGE_FAILED":
    case "APPLE_REVOCATION_FAILED":
      return isArabic
        ? "تعذر إلغاء ربط Apple بأمان. لم يتم حذف الحساب؛ حاول مرة أخرى."
        : "We could not safely revoke Apple access. Your account was not deleted; please try again.";
    case "NETWORK_ERROR":
      return isArabic
        ? "تعذر الاتصال بملامح. تحقق من الإنترنت ثم حاول مرة أخرى."
        : "Unable to reach MLAMH. Check your connection and try again.";
    default:
      return isArabic
        ? "تعذر حذف الحساب الآن. لم يتم إجراء حذف جزئي؛ حاول مرة أخرى."
        : "We could not delete the account right now. Please try again.";
  }
}

export default function AccountScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function executeDelete() {
    if (deleting) return;
    setDeleting(true);

    try {
      const appleLinked = await hasAppleIdentity();
      let appleAuthorizationCode: string | undefined;

      if (appleLinked) {
        const apple = await requestAppleDeletionAuthorizationCode();
        if (!apple.ok) {
          if (!apple.canceled) {
            Alert.alert(
              isArabic ? "تعذر تأكيد Apple" : "Apple confirmation failed",
              isArabic
                ? "لم يتم حذف حسابك. حاول مرة أخرى عندما تكون جاهزًا."
                : "Your account was not deleted. Please try again when you are ready.",
            );
          }
          return;
        }
        appleAuthorizationCode = apple.authorizationCode;
      }

      await deleteMobileAccount(appleAuthorizationCode);
      await signOutMobile();
      router.replace("/(public)" as never);
    } catch (error) {
      Alert.alert(
        isArabic ? "لم يتم حذف الحساب" : "Account not deleted",
        deletionErrorMessage(error, isArabic),
      );
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      isArabic ? "حذف الحساب نهائيًا؟" : "Delete account permanently?",
      isArabic
        ? "سيتم حذف حسابك وبياناته المرتبطة نهائيًا. لا يمكن التراجع عن هذه العملية."
        : "Your account and associated data will be permanently deleted. This cannot be undone.",
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isArabic ? "متابعة" : "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              isArabic ? "تأكيد الحذف" : "Confirm deletion",
              isArabic
                ? "هل أنت متأكد؟ إذا كان حسابك مرتبطًا بـApple فسيطلب منك النظام تأكيد Apple قبل الإكمال."
                : "Are you sure? If your account uses Apple, you will be asked to confirm with Apple before deletion.",
              [
                { text: isArabic ? "رجوع" : "Go back", style: "cancel" },
                {
                  text: isArabic ? "حذف حسابي" : "Delete my account",
                  style: "destructive",
                  onPress: () => void executeDelete(),
                },
              ],
            );
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    if (signingOut || deleting) return;
    setSigningOut(true);
    try {
      await signOutMobile();
      router.replace("/(public)" as never);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isArabic ? "رجوع" : "Back"}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <BackIcon size={20} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.eyebrow, { textAlign: align }]}>
          {isArabic ? "الحساب والخصوصية" : "ACCOUNT & PRIVACY"}
        </Text>
        <Text style={[styles.title, { textAlign: align }]}>
          {isArabic ? "إدارة حسابك" : "Manage your account"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: align }]}>
          {isArabic
            ? "تحكم في جلستك وحسابك من مكان واضح داخل ملامح."
            : "Manage your session and account from one clear place inside MLAMH."}
        </Text>

        <View style={styles.card}>
          <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
            <View style={styles.iconBox}>
              <ShieldCheck size={20} color={colors.gold} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.cardTitle, { textAlign: align }]}>
                {isArabic ? "خصوصيتك أولًا" : "Privacy first"}
              </Text>
              <Text style={[styles.cardBody, { textAlign: align }]}>
                {isArabic
                  ? "حذف الحساب يتم من الخادم. وإذا كان الحساب مرتبطًا بـApple يتم إلغاء تفويض Apple قبل إكمال الحذف."
                  : "Account deletion is completed server-side. Apple authorization is revoked first when the account is linked to Apple."}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={signingOut || deleting}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <LogOut size={19} color={colors.textPrimary} />
          <Text style={styles.actionText}>
            {signingOut
              ? isArabic
                ? "جارٍ تسجيل الخروج…"
                : "Signing out…"
              : isArabic
                ? "تسجيل الخروج"
                : "Sign out"}
          </Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={[styles.dangerTitle, { textAlign: align }]}>
            {isArabic ? "حذف الحساب" : "Delete account"}
          </Text>
          <Text style={[styles.dangerBody, { textAlign: align }]}>
            {isArabic
              ? "هذا الإجراء نهائي. سيُطلب منك التأكيد مرة أخرى قبل بدء الحذف."
              : "This action is permanent. You will be asked to confirm again before deletion starts."}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={deleting || signingOut}
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              (deleting || signingOut) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Trash2 size={18} color="#FF8A8A" />
            <Text style={styles.deleteText}>
              {deleting
                ? isArabic
                  ? "جارٍ حذف الحساب…"
                  : "Deleting account…"
                : isArabic
                  ? "حذف حسابي نهائيًا"
                  : "Delete my account permanently"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 72,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 2.2,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
    backgroundColor: "rgba(201,169,98,0.05)",
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flexOne: { flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.24)",
  },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  cardBody: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 5 },
  actionButton: {
    minHeight: 54,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionText: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: { color: "#FFB0B0", fontSize: 15, fontWeight: "800" },
  dangerBody: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: spacing.sm },
  deleteButton: {
    minHeight: 54,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,110,110,0.30)",
    backgroundColor: "rgba(255,110,110,0.06)",
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  deleteText: { color: "#FFB0B0", fontSize: 13, fontWeight: "800", textAlign: "center" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.84 },
});
