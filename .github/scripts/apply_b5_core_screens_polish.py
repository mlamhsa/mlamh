from pathlib import Path

def replace(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'marker missing in {path}: {old[:100]}')
    p.write_text(text.replace(old, new, 1))

# Opportunities / Discover
p = 'apps/mobile/app/opportunities/index.tsx'
replace(p, 'import { router } from "expo-router";\n', 'import { router } from "expo-router";\nimport { Bell, Search } from "lucide-react-native";\n')
replace(p, '<Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}><Text style={styles.notificationText}>{unreadCount > 0 ? String(Math.min(unreadCount, 99)) : "•"}</Text></Pressable>', '<Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}><Bell size={20} strokeWidth={1.9} color={theme.text} />{unreadCount > 0 ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{Math.min(unreadCount, 99)}</Text></View> : null}</Pressable>')
replace(p, '<View style={styles.searchBox}><TextInput value={query}', '<View style={styles.searchBox}><Search size={18} strokeWidth={1.9} color={theme.muted} /><TextInput value={query}')
replace(p, 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30, gap: 12 },', 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 12 },')
replace(p, 'topBar: { marginTop: 18, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },', 'topBar: { marginTop: 4, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },')
replace(p, 'pageTitle: { color: theme.text, fontSize: 32, lineHeight: 39, fontWeight: "700" }', 'pageTitle: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" }')
replace(p, 'notificationButton: { minWidth: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 9 }, notificationText: { color: theme.accent, fontSize: 12, fontWeight: "800" },', 'notificationButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", position: "relative" }, notificationBadge: { position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, notificationBadgeText: { color: theme.background, fontSize: 8, fontWeight: "900" },')
replace(p, 'searchBox: { marginTop: 12, minHeight: 50, borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.surface, paddingHorizontal: 14, justifyContent: "center" }, searchInput: { color: theme.text, fontSize: 14, paddingVertical: 12 },', 'searchBox: { marginTop: 10, minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }, searchInput: { flex: 1, color: theme.text, fontSize: 14, paddingVertical: 12 },')

# Applications
p = 'apps/mobile/app/applications/index.tsx'
replace(p, 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 30, gap: 12 },', 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30, gap: 12 },')
replace(p, 'title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }', 'title: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" }')
replace(p, 'statsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 14 }, stat: { flex: 1, gap: 3 },', 'statsRow: { flexDirection: "row", gap: 8 }, stat: { flex: 1, minHeight: 72, gap: 3, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 12, justifyContent: "center" },')

# Messages
p = 'apps/mobile/app/messages/index.tsx'
replace(p, 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 28 },', 'screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },')
replace(p, 'title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }', 'title: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" }')
replace(p, 'row: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 14 },', 'row: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },')
