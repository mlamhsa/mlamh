from pathlib import Path

path = Path('apps/mobile/app/profile/edit.tsx')
text = path.read_text()

old = '    <Section title={isArabic ? "البيانات الأساسية" : "Core details"} styles={styles}>'
new = '    <Section title={isArabic ? "البيانات الأساسية" : "Core details"} styles={styles} defaultOpen>'
if old not in text:
    raise SystemExit('core section marker missing')
text = text.replace(old, new, 1)

old = 'function Section({title,children,styles}:{title:string;children:React.ReactNode;styles:ReturnType<typeof createStyles>}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}'
new = 'function Section({title,children,styles,defaultOpen=false}:{title:string;children:React.ReactNode;styles:ReturnType<typeof createStyles>;defaultOpen?:boolean}){const [open,setOpen]=useState(defaultOpen);return <View style={[styles.section,open&&styles.sectionOpen]}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen((value)=>!value)} style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionChevron}>{open?"−":"+"}</Text></Pressable>{open?<View style={styles.sectionBody}>{children}</View>:null}</View>}'
if old not in text:
    raise SystemExit('Section component marker missing')
text = text.replace(old, new, 1)

old = 'section:{gap:13,borderTopWidth:1,borderColor:theme.border,paddingTop:20},sectionTitle:{color:theme.accent,fontSize:15,fontWeight:"900"}'
new = 'section:{borderWidth:1,borderColor:theme.border,borderRadius:18,backgroundColor:theme.surface,overflow:"hidden"},sectionOpen:{borderColor:"#C9A96255"},sectionHeader:{minHeight:62,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},sectionTitle:{flex:1,color:theme.text,fontSize:16,fontWeight:"900"},sectionChevron:{color:theme.accent,fontSize:24,fontWeight:"500"},sectionBody:{gap:13,paddingHorizontal:16,paddingBottom:18,borderTopWidth:1,borderTopColor:theme.border,paddingTop:16}'
if old not in text:
    raise SystemExit('section styles marker missing')
text = text.replace(old, new, 1)

path.write_text(text)
