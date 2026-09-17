import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { NativeAppChrome } from "@/src/navigation/NativeAppChrome";
import { AppBootstrap } from "@/src/runtime/AppBootstrap";
import { SessionProvider } from "@/src/runtime/SessionContext";
import { colors } from "@/src/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <SessionProvider>
          <AppBootstrap>
            <StatusBar style="light" />
            <NativeAppChrome>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: "fade",
                }}
              />
            </NativeAppChrome>
          </AppBootstrap>
        </SessionProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
