import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { getPublicOpportunities, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function OpportunitiesScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await getPublicOpportunities(locale, "SA");
      setItems(response.items);
    } catch {
      setError(locale === "ar" ? "تعذر تحميل الفرص الآن." : "Unable to load opportunities right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={theme.accent}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
            <Text style={styles.eyebrow}>MLAMH</Text>
            <Text style={styles.title}>{locale === "ar" ? "الفرص" : "Opportunities"}</Text>
            <Text style={styles.subtitle}>
              {locale === "ar"
                ? "فرص مختارة للمواهب، مرتبة لتصل لما يناسبك بسرعة."
                : "Curated opportunities for talent, designed for fast discovery."}
            </Text>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void load()}>
                <Text style={styles.retryText}>{locale === "ar" ? "إعادة المحاولة" : "Try again"}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {locale === "ar" ? "لا توجد فرص متاحة حاليًا." : "No opportunities available right now."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.featured && styles.featuredCard]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.type}>{item.opportunityType.replaceAll("_", " ")}</Text>
              {item.featured ? (
                <Text style={styles.featuredBadge}>{locale === "ar" ? "مميزة" : "Featured"}</Text>
              ) : null}
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.company}>{item.companyName}</Text>

            <View style={styles.metaRow}>
              {item.city ? <Text style={styles.meta}>{item.city}</Text> : null}
              {item.compensationType ? (
                <Text style={styles.meta}>{item.compensationType}</Text>
              ) : null}
            </View>

            <Text numberOfLines={3} style={styles.description}>
              {item.description}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 36, gap: 14 },
    header: { marginBottom: 12, gap: 8 },
    eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 2.4 },
    title: { color: theme.text, fontSize: 38, fontWeight: "300" },
    subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24, maxWidth: 560 },
    card: { borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 20, gap: 10 },
    featuredCard: { borderColor: theme.accent },
    cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    type: { color: theme.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 },
    featuredBadge: { color: theme.accent, fontSize: 11, fontWeight: "700" },
    cardTitle: { color: theme.text, fontSize: 24, lineHeight: 31, fontWeight: "400" },
    company: { color: theme.accent, fontSize: 14, fontWeight: "600" },
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    meta: { color: theme.muted, fontSize: 12 },
    description: { color: theme.muted, fontSize: 14, lineHeight: 22 },
    emptyState: { paddingVertical: 64, alignItems: "center", gap: 18 },
    emptyTitle: { color: theme.text, fontSize: 18, textAlign: "center" },
    retryButton: { borderRadius: 16, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 12 },
    retryText: { color: "#181818", fontWeight: "700" },
  });
}
