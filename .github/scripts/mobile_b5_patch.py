from pathlib import Path

def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))

svc = 'lib/talents/mobile-gallery.ts'
replace_once(svc,
  'export async function deleteMobileGalleryImage({ userId, url }: { userId: string; url: unknown }) {',
  '''export async function reorderMobileGallery({ userId, urls }: { userId: string; urls: unknown }) {
  const talent = await getTalent(userId); if (!talent.ok) return talent;
  if (!Array.isArray(urls) || urls.length !== talent.gallery.length) return { ok: false as const, code: "INVALID_GALLERY_ORDER" as const };
  const owned = urls.map((url) => getOwnedReference(talent.talentId, talent.gallery, url));
  if (owned.some((item) => !item)) return { ok: false as const, code: "IMAGE_NOT_FOUND" as const };
  const paths = owned.map((item) => item!.path);
  if (new Set(paths).size !== paths.length) return { ok: false as const, code: "INVALID_GALLERY_ORDER" as const };
  const currentPaths = new Set(talent.gallery.map((item) => getTalentGalleryPath(item)).filter(Boolean));
  if (paths.some((path) => !currentPaths.has(path))) return { ok: false as const, code: "INVALID_GALLERY_ORDER" as const };
  const orderedReferences = owned.map((item) => item!.reference);
  const { error } = await talent.supabase.from("talents").update({ gallery_images: orderedReferences }).eq("id", talent.talentId);
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  return { ok: true as const, gallery: await signTalentMediaReferences(orderedReferences, talent.supabase) };
}

export async function deleteMobileGalleryImage({ userId, url }: { userId: string; url: unknown }) {''')

route = 'app/api/talent/me/media/route.ts'
replace_once(route,
  'import { createMobileGalleryUpload, deleteMobileGalleryImage, finalizeMobileGalleryUpload, setMobileGalleryPrimary } from "@/lib/talents/mobile-gallery";',
  'import { createMobileGalleryUpload, deleteMobileGalleryImage, finalizeMobileGalleryUpload, reorderMobileGallery, setMobileGalleryPrimary } from "@/lib/talents/mobile-gallery";')
replace_once(route,
  '  const result = await setMobileGalleryPrimary({ userId: auth.user.id, url: body.url });\n  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });',
  '  const result = body.action === "reorder" ? await reorderMobileGallery({ userId: auth.user.id, urls: body.urls }) : await setMobileGalleryPrimary({ userId: auth.user.id, url: body.url });\n  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });')

api = 'apps/mobile/lib/api.ts'
replace_once(api,
  'export type GalleryPrimaryResult = { ok: true; url: string } | { ok: false; code: string };\nexport type GalleryDeleteResult',
  'export type GalleryPrimaryResult = { ok: true; url: string } | { ok: false; code: string };\nexport type GalleryReorderResult = { ok: true; gallery: string[] } | { ok: false; code: string };\nexport type GalleryDeleteResult')
replace_once(api,
  'export async function setTalentPrimaryImage(url: string): Promise<GalleryPrimaryResult> { return authedMutation<GalleryPrimaryResult>("/api/talent/me/media", "PATCH", { ok: false, code: "REQUEST_FAILED" }, { url }); }\nexport async function deleteTalentGalleryImage',
  'export async function setTalentPrimaryImage(url: string): Promise<GalleryPrimaryResult> { return authedMutation<GalleryPrimaryResult>("/api/talent/me/media", "PATCH", { ok: false, code: "REQUEST_FAILED" }, { url }); }\nexport async function reorderTalentGallery(urls: string[]): Promise<GalleryReorderResult> { return authedMutation<GalleryReorderResult>("/api/talent/me/media", "PATCH", { ok: false, code: "REQUEST_FAILED" }, { action: "reorder", urls }); }\nexport async function deleteTalentGalleryImage')

media = 'apps/mobile/app/profile/media.tsx'
replace_once(media,
  'import { deleteTalentGalleryImage, getTalentProfile, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";',
  'import { deleteTalentGalleryImage, getTalentProfile, reorderTalentGallery, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";')
replace_once(media,
  '  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);\n  const [error, setError] = useState<string | null>(null);',
  '  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);\n  const [selectedIndex, setSelectedIndex] = useState(0);\n  const [error, setError] = useState<string | null>(null);')
replace_once(media,
  '  function confirmDelete(url: string) {',
  '''  async function moveSelected(delta: -1 | 1) {
    const target = selectedIndex + delta;
    if (busyUrl || target < 0 || target >= gallery.length) return;
    const previous = gallery;
    const next = [...gallery];
    const [moved] = next.splice(selectedIndex, 1);
    next.splice(target, 0, moved);
    setGallery(next);
    setSelectedIndex(target);
    setBusyUrl(moved);
    setError(null);
    try {
      const result = await reorderTalentGallery(next);
      if (!result.ok) {
        setGallery(previous);
        setSelectedIndex(selectedIndex);
        setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
      } else setGallery(result.gallery);
    } catch {
      setGallery(previous);
      setSelectedIndex(selectedIndex);
      setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
    } finally { setBusyUrl(null); }
  }

  function confirmDelete(url: string) {''')
replace_once(media,
  '      setGallery(result.gallery);\n      setPrimaryUrl(result.primaryUrl);',
  '      setGallery(result.gallery);\n      setPrimaryUrl(result.primaryUrl);\n      setSelectedIndex((current) => Math.max(0, Math.min(current, result.gallery.length - 1)));')

p = Path(media)
text = p.read_text()
start = text.index('    {gallery.length ? <View style={styles.grid}>')
end = text.index('    {error ? <View style={styles.errorBox}>', start)
premium = '''    {gallery.length ? <View style={styles.carouselSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={284} decelerationRate="fast" contentContainerStyle={styles.carouselContent}>
        {gallery.map((uri, index) => { const isPrimary = primaryUrl === uri; const selected = selectedIndex === index; return <Pressable key={`${uri}-${index}`} onPress={() => setSelectedIndex(index)} style={[styles.carouselCard, selected && styles.carouselCardSelected]}>
          <Image source={{ uri }} style={styles.carouselImage} resizeMode="cover" />
          <View style={styles.imageMeta}><Text style={styles.imagePosition}>{index + 1}/{gallery.length}</Text>{isPrimary ? <Text style={styles.primaryBadge}>{isArabic ? "الرئيسية" : "Primary"}</Text> : null}</View>
        </Pressable>; })}
      </ScrollView>
      <View style={styles.selectedActions}>
        <View style={styles.orderActions}>
          <Pressable accessibilityRole="button" disabled={selectedIndex === 0 || Boolean(busyUrl)} onPress={() => void moveSelected(-1)} style={[styles.orderButton, (selectedIndex === 0 || Boolean(busyUrl)) && styles.disabled]}><Text style={styles.orderButtonText}>{isRtl ? "→" : "←"} {isArabic ? "تحريك" : "Move"}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={selectedIndex === gallery.length - 1 || Boolean(busyUrl)} onPress={() => void moveSelected(1)} style={[styles.orderButton, (selectedIndex === gallery.length - 1 || Boolean(busyUrl)) && styles.disabled]}><Text style={styles.orderButtonText}>{isArabic ? "تحريك" : "Move"} {isRtl ? "←" : "→"}</Text></Pressable>
        </View>
        {primaryUrl !== gallery[selectedIndex] ? <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(gallery[selectedIndex])} style={styles.primaryAction}><Text style={styles.primaryActionText}>{isArabic ? "تعيين كصورة رئيسية" : "Set as primary"}</Text></Pressable> : <View style={styles.primaryActive}><Text style={styles.primaryActiveText}>{isArabic ? "الصورة الرئيسية" : "Primary photo"}</Text></View>}
        <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(gallery[selectedIndex])} style={styles.deleteSelected}><Text style={styles.deleteText}>{isArabic ? "حذف الصورة" : "Delete photo"}</Text></Pressable>
      </View>
    </View> : <View style={styles.empty}><Text style={styles.emptyTitle}>{isArabic ? "ابدأ معرضك" : "Start your portfolio"}</Text><Text style={styles.emptyText}>{isArabic ? "أضف أول صورة احترافية لملفك." : "Add the first professional image to your profile."}</Text></View>}

'''
p.write_text(text[:start] + premium + text[end:])
replace_once(media,
  'content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 18, paddingTop: 48, paddingBottom: 54, gap: 18 },',
  'content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 54, gap: 16 },')
replace_once(media,
  '    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },',
  '    carouselSection: { gap: 14 },\n    carouselContent: { gap: 12, paddingRight: 18 },\n    carouselCard: { width: 272, borderRadius: 20, borderWidth: 1, borderColor: theme.border, overflow: "hidden", backgroundColor: theme.surface },\n    carouselCardSelected: { borderColor: theme.accent },\n    carouselImage: { width: "100%", aspectRatio: 0.78, backgroundColor: theme.surface },\n    imageMeta: { minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },\n    imagePosition: { color: theme.muted, fontSize: 11, fontWeight: "800" },\n    selectedActions: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 12, gap: 10, backgroundColor: theme.surface },\n    orderActions: { flexDirection: "row", gap: 8 },\n    orderButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 12, alignItems: "center", justifyContent: "center" },\n    orderButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },\n    primaryAction: { minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },\n    primaryActionText: { color: theme.background, fontSize: 13, fontWeight: "900" },\n    primaryActive: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", alignItems: "center", justifyContent: "center" },\n    primaryActiveText: { color: theme.accent, fontSize: 13, fontWeight: "900" },\n    deleteSelected: { minHeight: 44, alignItems: "center", justifyContent: "center" },\n    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },')

replace_once('apps/mobile/app/profile/settings.tsx',
  'content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 36, paddingBottom: 50, gap: 22 },',
  'content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 50, gap: 18 },')
replace_once('apps/mobile/app/profile/edit.tsx',
  'content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:20,paddingTop:32,paddingBottom:60,gap:18}',
  'content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:20,paddingTop:18,paddingBottom:60,gap:16}')
replace_once('apps/mobile/app/profile/index.tsx',
  'content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:20,paddingTop:24,paddingBottom:40,gap:18}',
  'content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:20,paddingTop:14,paddingBottom:40,gap:16}')
