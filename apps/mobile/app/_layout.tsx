import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBootstrap } from "@/src/app/AppBootstrap";
import { SessionProvider } from "@/src/app/SessionContext";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { colors } from "@/src/theme/tokens";

function NativeRootLaunchGuard() {
  useEffect(() => {
    let active = true;

    void Linking.getInitialURL().then((url) => {
      if (!active || !url) return;

      const normalized = url.trim();
      if (/^mlamh:\/{1,4}(?:[?#].*)?$/.test(normalized)) {
        router.replace("/");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <SessionProvider>
          <AppBootstrap>
            <NativeRootLaunchGuard />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: "fade",
              }}
            />
          </AppBootstrap>
        </SessionProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
