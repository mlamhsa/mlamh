import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Filter, Search, SearchX, ShieldCheck } from "lucide-react-native";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { displayValue } from "@/lib/display-values";
import { formatLatinNumber, isRtlLocale, toLatinDigits } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme, radii, spacing, typography } from "@/lib/theme";
import { getMobileTalents, type MobilePublicTalent, type TalentDirectoryFilters } from "@/lib/talents";

const EMPTY_FILTERS: TalentDirectoryFilters = { q:"", category:"", city:"", gender:"", nationality:"", ageMin:"", ageMax:"", heightMin:"", heightMax:"", language:"", dialect:"", skill:"", availability:"", readyToTravel:"", page:1 };
const DISCOVERY_SIZE = 12;
const SEARCH_SIZE = 20;

function hasDiscoveryIntent(filters: TalentDirectoryFilters) {
  return Boolean(filters.q?.trim() || filters.category || filters.city?.trim() || filters.gender || filters.nationality?.trim() || filters.ageMin?.trim() || filters.ageMax?.trim() || filters.heightMin?.trim() || filters.heightMax?.trim() || filters.language?.trim() || filters.dialect?.trim() || filters.skill?.trim() || filters.availability || filters.readyToTravel);
}

export default function TalentDirectoryScreen() {
  const { locale } = useAppLocale();
  const ar = locale === "ar";
  const rtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const [draft, setDraft] = useState<TalentDirectoryFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<TalentDirectoryFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<MobilePublicTalent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intentActive = useMemo(() => hasDiscoveryIntent(filters), [filters]);

  const load = useCallback(async (targetPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const searched = hasDiscoveryIntent(filters);
      const result = await getMobileTalents(locale, { ...filters, page: targetPage, pageSize: searched ? SEARCH_SIZE : DISCOVERY_SIZE });
      setItems((current) => append ? [...current, ...result.items.filter((next) => !current.some((item) => item.id === next.id))] : result.items);
      setTotal(result.total);
      setPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch {
      setError(ar ? "تعذر تحميل المواهب الآن." : "Unable to load talent right now.");
    } finally {
      setLoading(false); setRefreshing(false); setLoadingMore(false);
    }
  }, [ar, filters, locale]);

  useEffect(() => { void load(); }, [load]);

  function applyFilters() { setFilters({ ...draft, page:1 }); setFiltersOpen(false); }
  function clearFilters() { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setFiltersOpen(false); }
  function setCategory(value: "" | "actor" | "model") { const next={...draft,category:value,page:1}; setDraft(next); setFilters(next); }

  const header = <View style={s.header}>
    <View style={[s.headingRow, rtl && s.rowRtl]}>
      <View style={s.flex}><Text style={[s.brand, txt(rtl)]}>{ar ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={[s.title, compact && s.titleCompact, txt(rtl)]}>{ar ? "اكتشف المواهب" : "Discover talent"}</Text><Text style={[s.subtitle, txt(rtl)]}>{ar ? "ابدأ بمجموعة مختارة، ثم استخدم البحث والفلاتر للوصول إلى المواهب المناسبة لمشروعك." : "Start with a curated selection, then search and filter the full eligible talent pool for your project."}</Text></View>
      <View style={s.shield}><ShieldCheck size={21} color={darkTheme.accent}/></View>
    </View>

    <View style={[s.searchRow, rtl && s.rowRtl]}><View style={[s.searchBox, rtl && s.rowRtl]}><Search size={18} color={darkTheme.muted}/><TextInput value={draft.q ?? ""} onChangeText={(q)=>setDraft((current)=>({...current,q}))} onSubmitEditing={applyFilters} returnKeyType="search" placeholder={ar ? "الاسم، المدينة أو المهارة" : "Name, city or skill"} placeholderTextColor={darkTheme.muted} style={[s.searchInput, txt(rtl)]}/></View><Pressable accessibilityRole="button" accessibilityLabel={ar?"الفلاتر":"Filters"} onPress={()=>setFiltersOpen((value)=>!value)} style={[s.filterButton,filtersOpen&&s.filterButtonActive]}><Filter size={18} color={filtersOpen?darkTheme.background:darkTheme.accent}/></Pressable></View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chips, rtl && s.chipsRtl]}>{(["","actor","model"] as const).map((value)=><Pressable key={value||"all"} onPress={()=>setCategory(value)} style={[s.chip,draft.category===value&&s.chipActive]}><Text style={[s.chipText,draft.category===value&&s.chipTextActive]}>{value==="actor"?(ar?"ممثلون":"Actors"):value==="model"?(ar?"مودلز":"Models"):(ar?"الكل":"All")}</Text></Pressable>)}</ScrollView>

    {filtersOpen ? <View style={s.filterPanel}>
      <View style={[s.twoCols, rtl&&s.rowRtl]}><FilterInput value={draft.city??""} onChange={(city)=>setDraft((c)=>({...c,city}))} placeholder={ar?"المدينة":"City"} rtl={rtl}/><FilterInput value={draft.nationality??""} onChange={(nationality)=>setDraft((c)=>({...c,nationality}))} placeholder={ar?"الجنسية":"Nationality"} rtl={rtl}/></View>
      <View style={[s.chips, rtl&&s.chipsRtl]}>{(["","male","female"] as const).map((value)=><Pressable key={value||"any"} onPress={()=>setDraft((c)=>({...c,gender:value}))} style={[s.chip,draft.gender===value&&s.chipActive]}><Text style={[s.chipText,draft.gender===value&&s.chipTextActive]}>{value==="male"?(ar?"ذكر":"Male"):value==="female"?(ar?"أنثى":"Female"):(ar?"أي جنس":"Any gender")}</Text></Pressable>)}</View>
      <Text style={[s.filterLabel,txt(rtl)]}>{ar?"العمر":"Age"}</Text><View style={[s.twoCols,rtl&&s.rowRtl]}><FilterInput value={draft.ageMin??""} onChange={(ageMin)=>setDraft((c)=>({...c,ageMin:numeric(ageMin)}))} placeholder={ar?"من":"Min"} rtl={rtl} technical/><FilterInput value={draft.ageMax??""} onChange={(ageMax)=>setDraft((c)=>({...c,ageMax:numeric(ageMax)}))} placeholder={ar?"إلى":"Max"} rtl={rtl} technical/></View>
      <Text style={[s.filterLabel,txt(rtl)]}>{ar?"الطول (سم)":"Height (cm)"}</Text><View style={[s.twoCols,rtl&&s.rowRtl]}><FilterInput value={draft.heightMin??""} onChange={(heightMin)=>setDraft((c)=>({...c,heightMin:numeric(heightMin)}))} placeholder={ar?"من":"Min"} rtl={rtl} technical/><FilterInput value={draft.heightMax??""} onChange={(heightMax)=>setDraft((c)=>({...c,heightMax:numeric(heightMax)}))} placeholder={ar?"إلى":"Max"} rtl={rtl} technical/></View>
      <FilterInput value={draft.language??""} onChange={(language)=>setDraft((c)=>({...c,language}))} placeholder={ar?"اللغة":"Language"} rtl={rtl}/><FilterInput value={draft.dialect??""} onChange={(dialect)=>setDraft((c)=>({...c,dialect}))} placeholder={ar?"اللهجة":"Dialect"} rtl={rtl}/><FilterInput value={draft.skill??""} onChange={(skill)=>setDraft((c)=>({...c,skill}))} placeholder={ar?"المهارة":"Skill"} rtl={rtl}/>
      <View style={[s.chips,rtl&&s.chipsRtl]}><Pressable onPress={()=>setDraft((c)=>({...c,availability:c.availability==="available_now"?"":"available_now"}))} style={[s.chip,draft.availability==="available_now"&&s.chipActive]}><Text style={[s.chipText,draft.availability==="available_now"&&s.chipTextActive]}>{ar?"متاح الآن":"Available now"}</Text></Pressable><Pressable onPress={()=>setDraft((c)=>({...c,readyToTravel:c.readyToTravel==="true"?"":"true"}))} style={[s.chip,draft.readyToTravel==="true"&&s.chipActive]}><Text style={[s.chipText,draft.readyToTravel==="true"&&s.chipTextActive]}>{ar?"متاح للسفر":"Open to travel"}</Text></Pressable></View>
      <View style={[s.filterActions,rtl&&s.rowRtl]}><Pressable onPress={applyFilters} style={s.primary}><Text style={s.primaryText}>{ar?"عرض النتائج":"Show results"}</Text></Pressable><Pressable onPress={clearFilters} style={s.secondary}><Text style={s.secondaryText}>{ar?"مسح":"Clear"}</Text></Pressable></View>
    </View> : null}

    <View style={[s.sectionHead,rtl&&s.rowRtl]}><View><Text style={[s.sectionEyebrow,txt(rtl)]}>{intentActive?(ar?"نتائج البحث":"SEARCH RESULTS"):(ar?"مختارة لك":"CURATED")}</Text><Text style={[s.sectionTitle,txt(rtl)]}>{intentActive?(ar?"المواهب المطابقة":"Matching talent"):(ar?"مواهب مقترحة":"Suggested talent")}</Text></View>{intentActive?<Text style={s.count}>{formatLatinNumber(total,locale)}</Text>:null}</View>
    {!intentActive ? <Text style={[s.discoveryHint,txt(rtl)]}>{ar?"نعرض مجموعة محدودة افتراضيًا. استخدم البحث أو الفلاتر للوصول إلى بقية المواهب المؤهلة.":"A limited selection is shown by default. Search or filter to access the wider eligible pool."}</Text> : null}
  </View>;

  return <SafeAreaView style={s.screen} edges={["top"]}>
    <FlatList data={items} keyExtractor={(item)=>String(item.id)} ListHeaderComponent={header} renderItem={({item})=><TalentCard item={item} locale={locale}/>} ItemSeparatorComponent={()=><View style={{height:10}}/>} contentContainerStyle={[s.content,compact&&s.contentCompact]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load(1,false)}} tintColor={darkTheme.accent}/>} ListEmptyComponent={loading?<State><ActivityIndicator color={darkTheme.accent}/><Text style={s.stateText}>{ar?"جارٍ تجهيز المواهب…":"Loading talent…"}</Text></State>:error?<State><Text style={[s.error,txt(rtl)]}>{error}</Text><Pressable onPress={()=>void load()} style={s.secondary}><Text style={s.secondaryText}>{ar?"إعادة المحاولة":"Try again"}</Text></Pressable></State>:<State><SearchX size={24} color={darkTheme.accent}/><Text style={[s.emptyTitle,txt(rtl)]}>{ar?"لا توجد نتائج مطابقة":"No matching talent"}</Text><Text style={[s.stateText,txt(rtl)]}>{ar?"وسّع البحث أو قلّل عدد الفلاتر.":"Broaden the search or remove a filter."}</Text></State>} onEndReached={()=>{if(intentActive&&!loading&&!loadingMore&&page<totalPages)void load(page+1,true)}} onEndReachedThreshold={0.35} ListFooterComponent={loadingMore?<ActivityIndicator style={{padding:20}} color={darkTheme.accent}/>:<View style={{height:16}}/>} showsVerticalScrollIndicator={false}/>
    <PublisherTabBar active="talents" locale={locale}/>
  </SafeAreaView>;
}

function TalentCard({item,locale}:{item:MobilePublicTalent;locale:"ar"|"en"}){const ar=locale==="ar",rtl=isRtlLocale(locale);const facts=[item.city,item.age!=null?(ar?`${formatLatinNumber(item.age,locale)} سنة`:`${formatLatinNumber(item.age,locale)} yrs`):null,item.heightCm!=null?`${formatLatinNumber(item.heightCm,locale)} cm`:null].filter(Boolean).join(" · ");return <Pressable onPress={()=>router.push(`/talents/${encodeURIComponent(item.slug)}`)} style={({pressed})=>[s.card,pressed&&s.pressed]}><View style={s.photoWrap}>{item.imageUrl?<Image source={{uri:item.imageUrl}} style={s.photo} resizeMode="cover"/>:<View style={s.photoFallback}><Text style={s.photoInitial}>{item.name.slice(0,1).toUpperCase()}</Text></View>}{item.featured?<View style={[s.featured,rtl&&s.featuredRtl]}><Text style={s.featuredText}>{ar?"مميز":"FEATURED"}</Text></View>:null}</View><View style={[s.cardBody,{alignItems:rtl?"flex-end":"flex-start"}]}><View style={[s.nameRow,rtl&&s.rowRtl]}><Text numberOfLines={2} style={[s.name,txt(rtl)]}>{item.name}</Text>{item.verified?<ShieldCheck size={15} color={darkTheme.accent}/>:null}</View><Text style={[s.role,txt(rtl)]}>{displayValue(item.role,locale)??(ar?"موهبة":"Talent")}</Text>{facts?<Text numberOfLines={1} style={[s.facts,txt(rtl)]}>{facts}</Text>:null}{item.bio?<Text numberOfLines={2} style={[s.bio,txt(rtl)]}>{item.bio}</Text>:null}</View></Pressable>}
function FilterInput({value,onChange,placeholder,rtl,technical=false}:{value:string;onChange:(value:string)=>void;placeholder:string;rtl:boolean;technical?:boolean}){return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={darkTheme.muted} keyboardType={technical?"number-pad":"default"} style={[s.filterInput,technical?{textAlign:rtl?"right":"left",writingDirection:"ltr"}:txt(rtl)]}/>}
function State({children}:{children:React.ReactNode}){return <View style={s.state}>{children}</View>}
function numeric(value:string){return toLatinDigits(value).replace(/[^0-9]/g,"")}
function txt(rtl:boolean){return{textAlign:rtl?"right" as const:"left" as const,writingDirection:rtl?"rtl" as const:"ltr" as const}}

const s=StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{paddingHorizontal:spacing.lg,paddingBottom:112},contentCompact:{paddingHorizontal:14},header:{gap:14,paddingBottom:16},rowRtl:{flexDirection:"row-reverse"},flex:{flex:1,minWidth:0},headingRow:{flexDirection:"row",alignItems:"flex-start",gap:12},brand:{color:darkTheme.accent,fontSize:10,fontWeight:"900"},title:{...typography.pageTitle,color:darkTheme.text,marginTop:4},titleCompact:{fontSize:25,lineHeight:31},subtitle:{...typography.body,color:darkTheme.muted,marginTop:6,maxWidth:430},shield:{width:44,height:44,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center"},searchRow:{flexDirection:"row",gap:9},searchBox:{flex:1,minHeight:52,borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.md,backgroundColor:darkTheme.surface,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:13},searchInput:{flex:1,color:darkTheme.text,fontSize:13,paddingVertical:10},filterButton:{width:52,height:52,borderRadius:radii.md,borderWidth:1,borderColor:"#C9A96255",alignItems:"center",justifyContent:"center",backgroundColor:darkTheme.surface},filterButtonActive:{backgroundColor:darkTheme.accent},chips:{gap:7,paddingVertical:2},chipsRtl:{minWidth:"100%",justifyContent:"flex-end"},chip:{minHeight:36,borderRadius:18,borderWidth:1,borderColor:darkTheme.border,paddingHorizontal:13,alignItems:"center",justifyContent:"center",backgroundColor:darkTheme.surface},chipActive:{borderColor:darkTheme.accent,backgroundColor:darkTheme.chip},chipText:{color:darkTheme.muted,fontSize:10,fontWeight:"800"},chipTextActive:{color:darkTheme.accent},filterPanel:{borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.xl,backgroundColor:darkTheme.surface,padding:14,gap:10},twoCols:{flexDirection:"row",gap:9},filterInput:{flex:1,minHeight:46,borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.md,backgroundColor:darkTheme.background,color:darkTheme.text,paddingHorizontal:12,fontSize:12},filterLabel:{color:darkTheme.text,fontSize:10,fontWeight:"800",marginTop:2},filterActions:{flexDirection:"row",gap:9,marginTop:3},primary:{flex:1,minHeight:48,borderRadius:radii.md,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center"},primaryText:{color:darkTheme.background,fontSize:12,fontWeight:"900"},secondary:{minHeight:46,borderRadius:radii.md,borderWidth:1,borderColor:darkTheme.border,paddingHorizontal:15,alignItems:"center",justifyContent:"center"},secondaryText:{color:darkTheme.text,fontSize:11,fontWeight:"800"},sectionHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:4},sectionEyebrow:{color:darkTheme.accent,fontSize:8,fontWeight:"900"},sectionTitle:{color:darkTheme.text,fontSize:18,fontWeight:"900",marginTop:2},count:{color:darkTheme.muted,fontSize:10},discoveryHint:{color:darkTheme.muted,fontSize:10,lineHeight:16,marginTop:-6},card:{minHeight:126,borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.xl,backgroundColor:darkTheme.surface,overflow:"hidden",flexDirection:"row"},pressed:{opacity:.72},photoWrap:{width:116,minHeight:126,backgroundColor:darkTheme.surfaceElevated},photo:{width:"100%",height:"100%"},photoFallback:{flex:1,alignItems:"center",justifyContent:"center"},photoInitial:{color:darkTheme.accent,fontSize:30,fontWeight:"900"},featured:{position:"absolute",left:7,top:7,borderRadius:999,backgroundColor:darkTheme.accent,paddingHorizontal:7,paddingVertical:4},featuredRtl:{left:undefined,right:7},featuredText:{color:darkTheme.background,fontSize:7,fontWeight:"900"},cardBody:{flex:1,padding:13,gap:4,justifyContent:"center"},nameRow:{flexDirection:"row",alignItems:"center",gap:5,maxWidth:"100%"},name:{flexShrink:1,color:darkTheme.text,fontSize:16,lineHeight:21,fontWeight:"900"},role:{color:darkTheme.accent,fontSize:10,fontWeight:"900"},facts:{color:darkTheme.muted,fontSize:9,marginTop:2},bio:{color:darkTheme.muted,fontSize:10,lineHeight:16,marginTop:3},state:{minHeight:240,alignItems:"center",justifyContent:"center",gap:10,padding:24},stateText:{color:darkTheme.muted,fontSize:11,lineHeight:18,textAlign:"center"},error:{color:darkTheme.danger,fontSize:12},emptyTitle:{color:darkTheme.text,fontSize:16,fontWeight:"900"}});
