import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { darkTheme, spacing } from "@/lib/theme";

type Props = PropsWithChildren<{
  bottomNav?: boolean;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  edges?: Array<"top" | "right" | "bottom" | "left">;
}>;

/**
 * App-wide screen contract for Build 14.
 * Keeps content outside device chrome and reserves bottom-tab space consistently.
 */
export function AppScreen({ children, bottomNav = false, style, contentStyle, edges = ["top"] }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      <View
        style={[
          styles.content,
          bottomNav && { paddingBottom: Math.max(104, insets.bottom + 86) },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export const screenLayout = {
  horizontal: spacing.lg,
  horizontalCompact: 14,
  maxWidth: 700,
  sectionGap: spacing.lg,
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { flex: 1, backgroundColor: darkTheme.background },
});
