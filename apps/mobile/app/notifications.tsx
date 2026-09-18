import { router } from "expo-router";
import { Bell, BriefcaseBusiness, CheckCircle2, MessageCircle, RefreshCw, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { getMobileNotifications, markMobileNotificationRead } from "@/src/domains/notifications/api";
import type { MobileNotification } from "@/src/domains/notifications/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function NotificationsScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [items, setItems] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const data = await getMobileNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setError(isArabic ? "تعذر تحميل الإشعارات الآن." : "Unable to load notifications right now.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [isArabic]);

  useEffect(() => { void load(); }, [load]);

  async function open(item: MobileNotification) {
    if (!item.isRead) {
      try {
        await markMobileNotificationRead(item.id);
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch { /* navigation should still work */ }
    }
    if (item.target.type === "conversation") router.push(`/messages/${item.target.id}` as never);
    else if (item.target.type === "opportunity") router.push(`/opportunities/${item.target.id}` as never);
    else if (item.target.type === "publisher_opportunity") router.push(`/publisher-opportunities/${item.target.id}` as never);
    else if (item.target.type === "talent_applications") router.push("/applications" as never);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        <View style={[styles.hero, isArabic && styles.rtl]}> 
          <View style={styles.heroIcon}><Bell size={22} color={colors.gold} /></View>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "تنبيهات ملامح" : "MLAMH UPDATES"}</Text>
            <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "الإشعارات" : "Notifications"}</Text>
            <Text style={[styles.subtitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? `${unreadCount} غير مقروءة` : `${unreadCount} unread`}</Text>
          </View>
        </View>

        {loading ? <State text={isArabic ? "جارٍ تحميل الإشعارات…" : "Loading notifications…"} /> : null}
        {!loading && error ? (
          <View style={styles.state}><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><RefreshCw size={15} color="#080808" /><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Retry"}</Text></Pressable></View>
        ) : null}
        {!loading && !error && items.length === 0 ? <State text={isArabic ? "لا توجد إشعارات جديدة حاليًا." : "No notifications yet."} /> : null}

        <View style={styles.list}>
          {items.map((item) => <NotificationCard key={String(item.id)} item={item} isArabic={isArabic} onPress={() => void open(item)} />)}
        </View>
      </ScrollView>
    </View>
  );
}

function NotificationCard({ item, isArabic, onPress }: { item: MobileNotification; isArabic: boolean; onPress: () => void }) {
  const Icon = item.category === "message" ? MessageCircle : item.category === "application" || item.category === "invitation" ? BriefcaseBusiness : item.isRead ? CheckCircle2 : Sparkles;
  const date = item.createdAt ? new Date(item.createdAt) : null;
  const formatted = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" }).format(date) : "";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, !item.isRead && styles.cardUnread, isArabic && styles.rtl, pressed && styles.pressed]}>
      <View style={styles.cardIcon}><Icon size={19} color={colors.gold} /></View>
      <View style={styles.cardCopy}>
        <View style={[styles.cardTop, isArabic && styles.rtl]}>
          <Text numberOfLines={1} style={[styles.cardTitle, { textAlign: isArabic ? "right" : "left" }]}>{item.title || (isArabic ? "تنبيه" : "Notification")}</Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        {item.body ? <Text style={[styles.body, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.body}</Text> : null}
        {formatted ? <Text style={[styles.date, { textAlign: isArabic ? "right" : "left" }]}>{formatted}</Text> : null}
      </View>
    </Pressable>
  );
}

function State({ text }: { text: string }) {
  return <View style={styles.state}><Text style={styles.stateText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120 },
  rtl: { flexDirection: "row-reverse" },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg },
  heroIcon: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.08)" },
  heroCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: "700", marginTop: 3 },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.xl, padding: spacing.lg },
  cardUnread: { borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.05)" },
  cardIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(201,169,98,0.08)" },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.goldSoft },
  body: { color: colors.textSecondary, fontSize: 12, lineHeight: 20, marginTop: 6 },
  date: { color: colors.textMuted, fontSize: 10, marginTop: 8 },
  state: { minHeight: 140, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.lg },
  stateText: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  retry: { flexDirection: "row", alignItems: "center", gap: 7, minHeight: 42, borderRadius: radius.pill, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  retryText: { color: "#080808", fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
});
