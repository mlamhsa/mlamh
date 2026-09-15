import { router, useFocusEffect } from "expo-router";
import { BriefcaseBusiness, MessageCircle, RefreshCcw, Zap } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getConversations } from "@/src/domains/messages/api";
import type { MobileConversation } from "@/src/domains/messages/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

function relativeDate(value: string | null, isArabic: boolean) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isArabic ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }).format(date);
}

export function MessagesInboxScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [items, setItems] = useState<MobileConversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await getConversations();
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch {
      setError(isArabic ? "تعذر تحميل الرسائل." : "Unable to load messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        <View style={[styles.headerRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "الرسائل" : "MESSAGES"}</Text>
            <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "محادثات مرتبطة بالفرص" : "Opportunity-linked conversations"}</Text>
          </View>
          {unreadCount > 0 ? <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount}</Text></View> : null}
        </View>

        <Text style={[styles.description, { textAlign: align }]}>
          {isArabic
            ? "لا توجد رسائل مفتوحة خارج سياق فرصة أو طلب. كل محادثة مرتبطة بسياق واضح داخل ملامح."
            : "There are no open DMs. Every conversation stays tied to a clear opportunity or request context."}
        </Text>

        {loading ? (
          <StateCard text={isArabic ? "جارٍ تحميل المحادثات..." : "Loading conversations..."} />
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retryButton}>
              <RefreshCcw size={14} color="#090909" />
              <Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <StateCard text={isArabic ? "لا توجد محادثات حتى الآن." : "No conversations yet."} />
        ) : (
          <View style={styles.list}>
            {items.map((item) => <ConversationCard key={item.id} item={item} isArabic={isArabic} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConversationCard({ item, isArabic }: { item: MobileConversation; isArabic: boolean }) {
  const Icon = item.postingMode === "quick" ? Zap : BriefcaseBusiness;
  const align = isArabic ? "right" : "left";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/messages/${item.id}` as never)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.cardTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={[styles.modePill, item.postingMode === "quick" ? styles.quickPill : styles.castingPill]}>
          <Icon size={12} color={item.postingMode === "quick" ? "#F6D487" : colors.gold} />
          <Text style={[styles.modeText, item.postingMode === "quick" && styles.quickText]}>
            {item.postingMode === "quick" ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
          </Text>
        </View>
        <Text style={styles.date}>{relativeDate(item.lastActivityAt, isArabic)}</Text>
      </View>

      <View style={[styles.partyRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <MessageCircle size={18} color={colors.gold} />
        <View style={styles.partyCopy}>
          <Text numberOfLines={1} style={[styles.partyName, { textAlign: align }]}>{item.partyName}</Text>
          <Text numberOfLines={1} style={[styles.opportunity, { textAlign: align }]}>{item.opportunityTitle || (isArabic ? "فرصة ملامح" : "MLAMH opportunity")}</Text>
        </View>
        {item.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View> : null}
      </View>

      <Text numberOfLines={2} style={[styles.preview, { textAlign: align }]}>
        {item.latestMessage || (isArabic ? "افتح المحادثة لمتابعة الطلب." : "Open the conversation to continue.")}
      </Text>
    </Pressable>
  );
}

function StateCard({ text }: { text: string }) {
  return <View style={styles.stateCard}><Text style={styles.stateText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 56 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerRow: { alignItems: "flex-start" },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 37, fontWeight: "700", marginTop: spacing.sm },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.md },
  unreadPill: { minWidth: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  unreadPillText: { color: "#090909", fontSize: 13, fontWeight: "800" },
  list: { gap: spacing.md, marginTop: spacing.xl },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  cardTop: { justifyContent: "space-between" },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  quickPill: { borderColor: "rgba(246,212,135,0.28)", backgroundColor: "rgba(246,212,135,0.07)" },
  castingPill: { borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.06)" },
  modeText: { color: colors.gold, fontSize: 9, fontWeight: "700" },
  quickText: { color: "#F6D487" },
  date: { color: colors.textMuted, fontSize: 10 },
  partyRow: { marginTop: spacing.lg },
  partyCopy: { flex: 1 },
  partyName: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  opportunity: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  badgeText: { color: "#090909", fontSize: 10, fontWeight: "800" },
  preview: { color: "rgba(255,255,255,0.52)", fontSize: 12, lineHeight: 19, marginTop: spacing.md },
  stateCard: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center" },
  stateTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700", textAlign: "center" },
  stateText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center" },
  retryButton: { marginTop: spacing.lg, minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.gold, paddingHorizontal: spacing.xl },
  retryText: { color: "#090909", fontSize: 12, fontWeight: "800" },
});
