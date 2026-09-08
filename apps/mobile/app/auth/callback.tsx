import { useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { type Href, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { useAppLocale } from "@/lib/locale-context";
import { clearPendingSignupContext, consumeNativeAuthCallback, getPendingSignupContext, supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolvePostAuthHref(): Promise<Href> {
  const account = await getMobileAccountContext().catch(() => null);
  const accountHref = getAccountHomeHref(account);
  if (accountHref) return accountHref;

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.account_type === "publisher") return "/publisher/setup";
  if (user?.user_metadata?.account_type === "talent") return "/onboarding";
  return "/account-type";
}

export default function AuthCallbackScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const params = useLocalSearchParams<{
    code?: string | string[];
    type?: string | string[];
    access_token?: string | string[];
    refresh_token?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const styles = useMemo(() => createStyles(), []);
  const [message, setMessage] = useState(isArabic ? "جارٍ إكمال تسجيل الدخول…" : "Completing sign in…");

  useEffect(() => {
    let active = true;

    async function finishAuth() {
      const code = firstParam(params.code);
      const type = firstParam(params.type);
      const accessToken = firstParam(params.access_token);
      const refreshToken = firstParam(params.refresh_token);
      const callbackError = firstParam(params.error);

      if (callbackError) {
        const pendingSignup = await getPendingSignupContext().catch(() => null);
        await clearPendingSignupContext().catch(() => undefined);
        if (!active) return;
        router.replace(pendingSignup ? "/signup" : "/login");
        return;
      }

      let callbackUrl = await Linking.getInitialURL();
      if (!callbackUrl?.startsWith("mlamh://auth/callback")) {
        const query = new URLSearchParams();
        if (code) query.set("code", code);
        if (type) query.set("type", type);
        if (accessToken) query.set("access_token", accessToken);
        if (refreshToken) query.set("refresh_token", refreshToken);
        const queryString = query.toString();
        callbackUrl = `mlamh://auth/callback${queryString ? `?${queryString}` : ""}`;
      }

      const consumed = await consumeNativeAuthCallback(callbackUrl);
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (type === "recovery") {
        if (consumed || session) router.replace("/reset-password");
        else setMessage(isArabic ? "تعذر التحقق من رابط الاستعادة. اطلب رابطًا جديدًا." : "We could not verify the recovery link. Request a new one.");
        return;
      }

      if (consumed || session) {
        const pendingSignup = await getPendingSignupContext().catch(() => null);
        if (pendingSignup) {
          const existingAccount = await getMobileAccountContext().catch(() => null);
          if (!existingAccount) {
            await supabase.auth.updateUser({ data: {
              account_type: pendingSignup.accountType,
              signup_intent: pendingSignup.intent,
              talent_intent: pendingSignup.intent === "actor" || pendingSignup.intent === "model" ? pendingSignup.intent : null,
              preferred_locale: pendingSignup.preferredLocale ?? locale,
              terms_accepted: Boolean(pendingSignup.termsAcceptedAt),
              terms_accepted_at: pendingSignup.termsAcceptedAt ?? null,
              onboarding_status: "account_details_required",
              onboarding_step: "account_details",
              approval_status: "not_submitted",
            }}).catch(() => undefined);
            await clearPendingSignupContext().catch(() => undefined);
            router.replace({ pathname: "/complete-account", params: { accountType: pendingSignup.accountType, intent: pendingSignup.intent } });
            return;
          }
          await clearPendingSignupContext().catch(() => undefined);
        }

        router.replace(await resolvePostAuthHref());
        return;
      }

      const pendingSignup = await getPendingSignupContext().catch(() => null);
      await clearPendingSignupContext().catch(() => undefined);
      if (!active) return;
      setMessage(isArabic ? "تعذر إكمال المصادقة. سنعيدك للمحاولة مرة أخرى." : "We could not complete authentication. Returning you so you can try again.");
      setTimeout(() => router.replace(pendingSignup ? "/signup" : "/login"), 700);
    }

    void finishAuth();
    return () => { active = false; };
  }, [isArabic, locale, params.access_token, params.code, params.error, params.error_description, params.refresh_token, params.type]);

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <View style={styles.content}>
      <Text style={[styles.brand, isArabic && styles.rtlText]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      <ActivityIndicator size="small" color={darkTheme.accent} />
      <Text accessibilityLiveRegion="polite" style={[styles.message, isArabic && styles.rtlText]}>{message}</Text>
    </View>
  </SafeAreaView>;
}

function createStyles() { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 28 },
  brand: { color: darkTheme.accent, fontSize: 16, fontWeight: "800", letterSpacing: 2 },
  message: { color: darkTheme.text, fontSize: 15, lineHeight: 23, textAlign: "center", maxWidth: 340 },
  rtlText: { writingDirection: "rtl", textAlign: "center", letterSpacing: 0 },
}); }
