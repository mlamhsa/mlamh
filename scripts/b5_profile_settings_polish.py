from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Expected block not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1))

# Profile: tighten hierarchy and turn identity/status blocks into premium cards.
profile = 'apps/mobile/app/profile/index.tsx'
replace_once(profile,
  '<View><Text style={styles.eyebrow}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={styles.pageTitle}>{isArabic ? "ملفي" : "Profile"}</Text></View>',
  '<View><Text style={styles.eyebrow}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={styles.pageTitle}>{isArabic ? "الملف الشخصي" : "Profile"}</Text></View>')
replace_once(profile,
  'identitySection:{alignItems:"center",gap:8},avatarWrap:{width:132,height:132,borderRadius:66,position:"relative"},avatar:{width:132,height:132,borderRadius:66},avatarPlaceholder:{width:132,height:132,borderRadius:66,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:theme.surface},avatarInitial:{fontSize:54,color:theme.accent,fontWeight:"500"}',
  'identitySection:{alignItems:"center",gap:7,borderWidth:1,borderColor:theme.border,borderRadius:24,paddingHorizontal:18,paddingTop:20,paddingBottom:18,backgroundColor:theme.surface},avatarWrap:{width:112,height:112,borderRadius:56,position:"relative"},avatar:{width:112,height:112,borderRadius:56},avatarPlaceholder:{width:112,height:112,borderRadius:56,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:theme.chip},avatarInitial:{fontSize:46,color:theme.accent,fontWeight:"500"}')
replace_once(profile,
  'pageTitle:{color:theme.text,fontSize:36,lineHeight:44,fontWeight:"800"}',
  'pageTitle:{color:theme.text,fontSize:30,lineHeight:36,fontWeight:"900"}')
replace_once(profile,
  'name:{color:theme.text,fontSize:30,fontWeight:"900"},category:{color:theme.accent,fontSize:16,fontWeight:"800"},location:{color:theme.muted,fontSize:15}',
  'name:{color:theme.text,fontSize:26,fontWeight:"900"},category:{color:theme.accent,fontSize:14,fontWeight:"800"},location:{color:theme.muted,fontSize:13}')
replace_once(profile,
  'statsRow:{width:"100%",flexDirection:"row",borderTopWidth:1,borderBottomWidth:1,borderColor:theme.border,marginTop:12},stat:{flex:1,alignItems:"center",paddingVertical:15},statValue:{color:theme.text,fontSize:24,fontWeight:"900"},statLabel:{color:theme.muted,fontSize:12,marginTop:3}',
  'statsRow:{width:"100%",flexDirection:"row",gap:8,marginTop:10},stat:{flex:1,alignItems:"center",paddingVertical:11,borderRadius:14,backgroundColor:theme.chip},statValue:{color:theme.text,fontSize:20,fontWeight:"900"},statLabel:{color:theme.muted,fontSize:10,marginTop:2}')
replace_once(profile,
  'statusStrip:{flexDirection:"row",gap:10},statusItem:{flex:1,borderBottomWidth:1,borderColor:theme.border,paddingBottom:12}',
  'statusStrip:{flexDirection:"row",gap:8},statusItem:{flex:1,borderWidth:1,borderColor:theme.border,borderRadius:14,paddingHorizontal:10,paddingVertical:11,backgroundColor:theme.surface}')
replace_once(profile,
  'readinessCard:{borderWidth:1,borderColor:theme.border,borderRadius:18,padding:18,gap:13}',
  'readinessCard:{borderWidth:1,borderColor:theme.border,borderRadius:22,padding:16,gap:12,backgroundColor:theme.surface}')

# Settings: match the MLAMH web menu language with labeled groups and stronger icon tiles.
settings = 'apps/mobile/app/profile/settings.tsx'
replace_once(settings,
  '<View style={styles.languageCard}>',
  '<Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "التفضيلات" : "PREFERENCES"}</Text>\n    <View style={styles.languageCard}>')
replace_once(settings,
  '<View style={styles.group}>{rows.map((row, index) => {',
  '<Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "الحساب والدعم" : "ACCOUNT & SUPPORT"}</Text>\n    <View style={styles.group}>{rows.map((row, index) => {')
replace_once(settings,
  'title: { color: theme.text, fontSize: 36, fontWeight: "900" },',
  'title: { color: theme.text, fontSize: 30, lineHeight: 36, fontWeight: "900" },')
replace_once(settings,
  'subtitle: { color: theme.muted, fontSize: 15, lineHeight: 23, marginTop: 7 },',
  'subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },\n    sectionLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginTop: 2 },')
replace_once(settings,
  'languageCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 16, gap: 14, backgroundColor: theme.surface },',
  'languageCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 22, padding: 15, gap: 13, backgroundColor: theme.surface },')
replace_once(settings,
  'iconShell: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.chip },',
  'iconShell: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border },')
replace_once(settings,
  'pushCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 16, gap: 13, backgroundColor: theme.surface },',
  'pushCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 22, padding: 15, gap: 13, backgroundColor: theme.surface },')
replace_once(settings,
  'group: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, overflow: "hidden", backgroundColor: theme.surface },',
  'group: { borderWidth: 1, borderColor: theme.border, borderRadius: 22, overflow: "hidden", backgroundColor: theme.surface },')
replace_once(settings,
  'row: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },',
  'row: { minHeight: 72, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },')
replace_once(settings,
  'rowTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },',
  'rowTitle: { color: theme.text, fontSize: 15, fontWeight: "800" },')

# Edit profile: reduce the hero footprint and make sections feel more like contained native cards.
edit = 'apps/mobile/app/profile/edit.tsx'
replace_once(edit,
  '<Text style={[styles.title,{textAlign:align}]}>{isArabic ? "بيانات ملفك" : "Profile details"}</Text><Text style={[styles.subtitle,{textAlign:align}]}>{isArabic ? "عدّل ما تحتاجه واحفظ كل تغيير بشكل مستقل." : "Update only what you need. Each change can be saved independently."}</Text>',
  '<Text style={[styles.title,{textAlign:align}]}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text><Text style={[styles.subtitle,{textAlign:align}]}>{isArabic ? "عدّل القسم الذي تحتاجه فقط. الحفظ لا يتطلب إكمال بقية الملف." : "Edit only the section you need. Saving does not require completing the rest of your profile."}</Text>')
# Regex-style simple replacements for common style tokens in the one-line stylesheet.
p = Path(edit)
text = p.read_text()
text = text.replace('title:{color:theme.text,fontSize:36,fontWeight:"900"}', 'title:{color:theme.text,fontSize:30,lineHeight:36,fontWeight:"900"}')
text = text.replace('section:{borderWidth:1,borderColor:theme.border,borderRadius:18,padding:16,gap:13}', 'section:{borderWidth:1,borderColor:theme.border,borderRadius:22,padding:15,gap:12,backgroundColor:theme.surface}')
text = text.replace('sectionTitle:{color:theme.accent,fontSize:17,fontWeight:"900"}', 'sectionTitle:{color:theme.accent,fontSize:15,fontWeight:"900"}')
p.write_text(text)
