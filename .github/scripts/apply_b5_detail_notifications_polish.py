from pathlib import Path

def replace(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'marker missing in {path}: {old[:100]}')
    p.write_text(text.replace(old, new, 1))

p = 'apps/mobile/app/opportunities/[slug].tsx'
replace(p, 'content: { paddingHorizontal: 18, paddingTop: 26, paddingBottom: 148, gap: 18 }', 'content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 148, gap: 16 }')
replace(p, 'title: { color: theme.text, fontSize: 31, lineHeight: 39, fontWeight: "700" }', 'title: { color: theme.text, fontSize: 28, lineHeight: 35, fontWeight: "800" }')
replace(p, 'factStrip: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 14 }, fact: { flex: 1, paddingHorizontal: 8, gap: 4 }', 'factStrip: { flexDirection: "row", gap: 8 }, fact: { flex: 1, minHeight: 72, paddingHorizontal: 10, paddingVertical: 12, gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, justifyContent: "center" }')

p = 'apps/mobile/app/notifications/index.tsx'
replace(p, 'content: { paddingHorizontal: 18, paddingTop: 44, paddingBottom: 20 }', 'content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 }')
replace(p, 'title: { color: theme.text, fontSize: 34, lineHeight: 42, fontWeight: "700", marginTop: 5 }', 'title: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800", marginTop: 4 }')
replace(p, 'summaryCard: { minHeight: 92, flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, overflow: "hidden" }', 'summaryCard: { minHeight: 82, flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, overflow: "hidden" }')
