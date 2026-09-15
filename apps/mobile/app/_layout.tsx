import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBootstrap } from "@/src/app/AppBootstrap";
import { colors } from "@/src/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppBootstrap>
        <StatusBar style="light" backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        />
      </AppBootstrap>
    </SafeAreaProvider>
  );
}
