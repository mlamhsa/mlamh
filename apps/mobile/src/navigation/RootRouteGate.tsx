import { Redirect, router, type Href } from "expo-router";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

const ROUTES = {
  public: "/public-home",
  accountType: "/account-type",
  talent: "/talent-home",
  publisher: "/publisher-home",
} as const;

export function RootRouteGate() {
  const session = useSessionContext();
  const { locale, hydrated } = useLocale();
  const isArabic = locale === "ar";

  if (!hydrated || session.status === "loading") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.brand}>MLAMH</Text>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.loadingText}>
            {isArabic ? "جارٍ تجهيز ملامح…" : "Preparing MLAMH…"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "unavailable") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.brand}>MLAMH</Text>
          <Text style={styles.errorTitle}>
            {isArabic ? "تعذر الاتصال بملامح" : "Unable to reach MLAMH"}
          </Text>
          <Text style={styles.errorText}>
            {isArabic
              ? "تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى. لن نغيّر نوع حسابك بسبب مشكلة اتصال مؤقتة."
              : "Check your internet connection and try again. A temporary connection issue will not change your account type."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void session.refresh()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "identity_conflict") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.brand}>MLAMH</Text>
          <Text style={styles.errorTitle}>
            {isArabic ? "هذا البريد مرتبط بحساب موجود" : "This email already has an account"}
          </Text>
          <Text style={styles.errorText}>
            {isArabic
              ? "لم ننشئ حسابًا جديدًا ولم ندمج الحسابات تلقائيًا. سجّل الدخول بالطريقة التي استخدمتها سابقًا لهذا الحساب."
              : "We did not create a new account or merge identities automatically. Sign in using the method you originally used for this account."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void supabase.auth.signOut({ scope: "local" }).then(async () => {
              await session.refresh();
              router.replace("/login" as never);
            })}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>{isArabic ? "تسجيل الدخول للحساب الموجود" : "Sign in to existing account"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "unsupported_account") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.brand}>MLAMH</Text>
          <Text style={styles.errorTitle}>
            {isArabic ? "حساب الإدارة" : "Admin account"}
          </Text>
          <Text style={styles.errorText}>
            {isArabic
              ? "تم تسجيل الدخول بنجاح، لكن لوحة الإدارة ليست جزءًا من تطبيق المواهب والناشرين. يمكنك فتح لوحة الإدارة على الويب أو تسجيل الخروج."
              : "You are signed in, but admin tools are not part of the talent and publisher app. Open the web admin panel or sign out."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL("https://mlamh.net/admin")}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>{isArabic ? "فتح لوحة الإدارة" : "Open admin panel"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void supabase.auth.signOut({ scope: "local" }).then(() => session.refresh())}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.retryPressed]}
          >
            <Text style={styles.secondaryText}>{isArabic ? "تسجيل الخروج" : "Sign out"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "guest") {
    return <Redirect href={ROUTES.public as Href} />;
  }

  if (session.status === "account_missing") {
    return <Redirect href={ROUTES.accountType as Href} />;
  }

  if (session.status === "talent") {
    return <Redirect href={ROUTES.talent as Href} />;
  }

  return <Redirect href={ROUTES.publisher as Href} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  brand: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 360,
  },
  retryButton: {
    minWidth: 180,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  retryPressed: {
    opacity: 0.84,
  },
  retryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minWidth: 180,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
});
