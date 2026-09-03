import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  getConversation,
  sendMessage,
  type ConversationDetailResponse,
  type MobileMessage,
} from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const result = await getConversation(conversationId);
    if (!result) {
      setError(locale === "ar" ? "تعذر فتح المحادثة." : "Unable to open this conversation.");
    } else {
      setData(result);
      setError(null);
    }
    setLoading(false);
  }, [conversationId, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    const body = draft.trim();
    if (!conversationId || !body || sending) return;

    setSending(true);
    const result = await sendMessage(conversationId, body);
    if (result.ok) {
      setDraft("");
      setData((current) =>
        current
          ? { ...current, messages: [...current.messages, result.message] }
          : current,
      );
    } else {
      setError(locale === "ar" ? "تعذر إرسال الرسالة." : "Unable to send the message.");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>{locale === "ar" ? "رجوع" : "Back"}</Text>
        </Pressable>
      </View>
    );
  }

  const canSend = data.conversation.status === "active";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text>
        </Pressable>
        <Text style={styles.partyName}>{data.conversation.partyName}</Text>
        <Text style={styles.opportunity}>{data.conversation.opportunityTitle ?? "MLAMH"}</Text>
      </View>

      <FlatList
        data={data.messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => <MessageBubble message={item} styles={styles} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {locale === "ar" ? "ابدأ المحادثة بعد قبول طلبك." : "Start the conversation after your application is accepted."}
          </Text>
        }
      />

      <View style={styles.composer}>
        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={canSend && !sending}
            multiline
            maxLength={4000}
            placeholder={canSend ? (locale === "ar" ? "اكتب رسالة..." : "Write a message...") : (locale === "ar" ? "المحادثة مغلقة" : "Conversation closed")}
            placeholderTextColor={theme.muted}
            style={styles.input}
          />
          <Pressable
            disabled={!canSend || !draft.trim() || sending}
            style={({ pressed }) => [styles.sendButton, (pressed || !canSend || !draft.trim() || sending) && styles.sendDisabled]}
            onPress={() => void submit()}
          >
            <Text style={styles.sendText}>{locale === "ar" ? "إرسال" : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, styles }: { message: MobileMessage; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={[styles.bubble, message.isMine ? styles.mine : styles.theirs]}>
      <Text style={[styles.messageText, message.isMine && styles.mineText]}>{message.body}</Text>
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.background, gap: 4 },
    back: { color: theme.accent, fontSize: 13, fontWeight: "600", marginBottom: 8 },
    partyName: { color: theme.text, fontSize: 22, fontWeight: "500" },
    opportunity: { color: theme.muted, fontSize: 12 },
    messages: { padding: 16, gap: 10, flexGrow: 1, justifyContent: "flex-end" },
    bubble: { maxWidth: "82%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
    mine: { alignSelf: "flex-end", backgroundColor: theme.accent },
    theirs: { alignSelf: "flex-start", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    messageText: { color: theme.text, fontSize: 15, lineHeight: 21 },
    mineText: { color: "#181818" },
    empty: { color: theme.muted, textAlign: "center", paddingVertical: 50 },
    composer: { borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 22, gap: 6, backgroundColor: theme.background },
    composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    input: { flex: 1, maxHeight: 120, minHeight: 48, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    sendButton: { backgroundColor: theme.accent, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15 },
    sendDisabled: { opacity: 0.45 },
    sendText: { color: "#181818", fontWeight: "700" },
    error: { color: theme.text, textAlign: "center", fontSize: 17 },
    inlineError: { color: "#C84F4F", fontSize: 12, textAlign: "center" },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 },
    secondaryButtonText: { color: theme.text, fontWeight: "600" },
  });
}
