import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getConversation, sendMessage, type ConversationDetailResponse, type MobileMessage } from "@/lib/api";
import { getCurrentUserId, markConversationRead, subscribeToConversationMessages } from "@/lib/chat";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const listRef = useRef<FlatList<MobileMessage>>(null);
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const appendMessage = useCallback((message: MobileMessage) => {
    setData((current) => {
      if (!current || current.messages.some((item) => String(item.id) === String(message.id))) return current;
      return { ...current, messages: [...current.messages, message] };
    });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const load = useCallback(async () => {
    if (!conversationId) { setLoading(false); setError(isArabic ? "تعذر تحديد المحادثة." : "Unable to identify this conversation."); return; }
    setLoading(true); setError(null);
    try {
      const result = await getConversation(conversationId);
      if (!result) setError(isArabic ? "تعذر فتح المحادثة." : "Unable to open this conversation.");
      else { setData(result); void markConversationRead(conversationId); }
    } catch {
      setError(isArabic ? "تعذر فتح المحادثة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to open this conversation. Check your connection and try again.");
    } finally { setLoading(false); }
  }, [conversationId, isArabic]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    let cleanup: (() => void) | undefined;
    let active = true;
    void getCurrentUserId().then((currentUserId) => {
      if (!active || !currentUserId) return;
      cleanup = subscribeToConversationMessages({
        conversationId,
        currentUserId,
        onMessage: (message) => {
          appendMessage(message);
          if (!message.isMine) void markConversationRead(conversationId);
        },
      });
      if (active) setLive(true);
    });
    return () => { active = false; setLive(false); cleanup?.(); };
  }, [appendMessage, conversationId]);

  async function submit() {
    const body = draft.trim();
    if (!conversationId || !body || sending) return;
    setSending(true); setError(null);
    try {
      const result = await sendMessage(conversationId, body);
      if (result.ok) { setDraft(""); appendMessage(result.message); }
      else setError(isArabic ? "تعذر إرسال الرسالة." : "Unable to send the message.");
    } catch {
      setError(isArabic ? "تعذر إرسال الرسالة. حاول مرة أخرى." : "Unable to send the message. Please try again.");
    } finally { setSending(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!data) return <View style={styles.centered}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable style={styles.secondaryButton} onPress={() => void load()}><Text style={styles.secondaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  const canSend = data.conversation.status === "active";
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
    <View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.backIcon}>‹</Text></Pressable>
      <View style={styles.headerIdentity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{data.conversation.partyName.slice(0, 1)}</Text></View>
        <View style={styles.headerText}><Text accessibilityRole="header" numberOfLines={1} style={styles.partyName}>{data.conversation.partyName}</Text><View style={styles.statusRow}><View style={[styles.liveDot, !live && styles.offlineDot]} /><Text style={styles.liveText}>{live ? (isArabic ? "متصل" : "Online") : (isArabic ? "جارٍ الاتصال" : "Connecting")}</Text></View></View>
      </View>
      <Text style={styles.moreIcon}>•••</Text>
      <Text numberOfLines={1} style={styles.opportunity}>{data.conversation.opportunityTitle ?? "MLAMH"}</Text>
    </View>

    <FlatList ref={listRef} data={data.messages} keyExtractor={(item) => String(item.id)} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.messages} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} renderItem={({ item }) => <MessageBubble message={item} locale={locale} styles={styles} />} ListEmptyComponent={<Text style={styles.empty}>{isArabic ? "ابدأ المحادثة بعد قبول طلبك." : "Start the conversation after your application is accepted."}</Text>} />

    <View style={styles.composer}>{error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.inlineError}>{error}</Text> : null}<View style={styles.composerRow}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إضافة مرفق" : "Add attachment"} style={styles.addButton}><Text style={styles.addText}>＋</Text></Pressable><TextInput accessibilityLabel={isArabic ? "نص الرسالة" : "Message text"} value={draft} onChangeText={setDraft} editable={canSend && !sending} multiline maxLength={4000} placeholder={canSend ? (isArabic ? "اكتب رسالة..." : "Write a message...") : (isArabic ? "المحادثة مغلقة" : "Conversation closed")} placeholderTextColor={theme.muted} style={styles.input} /><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الرسالة" : "Send message"} accessibilityState={{ disabled: !canSend || !draft.trim() || sending, busy: sending }} disabled={!canSend || !draft.trim() || sending} style={({ pressed }) => [styles.sendButton, (pressed || !canSend || !draft.trim() || sending) && styles.sendDisabled]} onPress={() => void submit()}><Text style={styles.sendText}>➤</Text></Pressable></View></View>
  </KeyboardAvoidingView>;
}

function MessageBubble({ message, locale, styles }: { message: MobileMessage; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const label = message.isMine ? `${locale === "ar" ? "أنت" : "You"}: ${message.body}` : message.body;
  return <View accessible accessibilityLabel={label} style={[styles.bubble, message.isMine ? styles.mine : styles.theirs]}><Text style={[styles.messageText, message.isMine && styles.mineText]}>{message.body}</Text></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.background, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  backIcon: { color: theme.text, fontSize: 31, lineHeight: 34 }, headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }, avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, avatarText: { color: theme.accent, fontSize: 18, fontWeight: "800" }, headerText: { flex: 1, gap: 2 }, partyName: { color: theme.text, fontSize: 16, fontWeight: "800" }, statusRow: { flexDirection: "row", alignItems: "center", gap: 5 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent }, offlineDot: { backgroundColor: theme.muted }, liveText: { color: theme.muted, fontSize: 10, fontWeight: "600" }, moreIcon: { color: theme.text, fontSize: 18, letterSpacing: 1.5 }, opportunity: { width: "100%", color: theme.muted, fontSize: 11, paddingHorizontal: 52 },
  messages: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 9, flexGrow: 1, justifyContent: "flex-end" }, bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }, mine: { alignSelf: "flex-end", backgroundColor: theme.accent, borderBottomRightRadius: 6 }, theirs: { alignSelf: "flex-start", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 6 }, messageText: { color: theme.text, fontSize: 15, lineHeight: 21 }, mineText: { color: "#2E2E2E", fontWeight: "600" }, empty: { color: theme.muted, textAlign: "center", paddingVertical: 50 },
  composer: { borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 20, gap: 6, backgroundColor: theme.background }, composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, addButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, addText: { color: theme.accent, fontSize: 24, lineHeight: 25 }, input: { flex: 1, maxHeight: 120, minHeight: 46, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 23, paddingHorizontal: 15, paddingVertical: 11, fontSize: 15 }, sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, sendDisabled: { opacity: 0.42 }, sendText: { color: "#2E2E2E", fontWeight: "900", fontSize: 18 }, error: { color: theme.text, textAlign: "center", fontSize: 17 }, inlineError: { color: "#C84F4F", fontSize: 12, textAlign: "center" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontWeight: "600" }, back: { color: theme.accent, fontSize: 13, fontWeight: "700" }
}); }
