import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBootstrap } from "@/src/runtime/AppBootstrap";
import { SessionProvider } from "@/src/runtime/SessionContext";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { colors } from "@/src/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <SessionProvider>
          <AppBootstrap>
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
