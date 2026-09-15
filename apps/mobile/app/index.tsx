import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function FoundationScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>MLAMH</Text>
        <Text style={styles.title}>ملامح</Text>
        <Text style={styles.subtitle}>
          Native V3 foundation is connected to the current product architecture.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Foundation only</Text>
          <Text style={styles.cardText}>
            Public Home, Talent, Opportunities and Scene will be rebuilt from the current Mobile Web and main product truth — not from the legacy mobile UI.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: "300",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  cardTitle: {
    color: colors.gold,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
