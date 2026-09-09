import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Filter, Search, ShieldCheck } from "lucide-react-native";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { formatLatinNumber, isRtlLocale, toLatinDigits } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";
import { getMobileTalents, type MobilePublicTalent, type TalentDirectoryFilters } from "@/lib/talents";

const EMPTY: TalentDirectoryFilters = { q:"", category:"", city:"", gender:"", nationality:"", ageMin:"", ageMax:"", heightMin:"", heightMax:"", page:1 };

export default function TalentDirectoryScreen() {
  const { locale } = useAppLocale();
  const ar = locale === "ar";
  const rtl = isRtlLocale(locale);
  const [draft,setDraft]=useState<TalentDirectoryFilters>(EMPTY);
  const [filters,setFilters]=useState<TalentDirectoryFilters>(EMPTY);
  const [items,setItems]=useState<MobilePublicTalent[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [loadingMore,setLoadingMore]=useState(false);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async(targetPage=1,append=false)=>{
    append?setLoadingMore(true):setLoading(true); setError(null);
    try{
      const result=await getMobileTalents(locale,{...filters,page:targetPage});
      setItems((current)=>append?[...current,...result.items.filter((next)=>!current.some((x)=>x.id===next.id))]:result.items);
      setTotal(result.total);setPage(result.currentPage);setTotalPages(result.totalPages);
    }catch{setError(ar?"تعذر تحميل المواهب الآن.":"Unable to load talent right now.");}
    finally{setLoading(false);setRefreshing(false);setLoadingMore(false);}
  },[ar,filters,locale]);
  useEffect(()=>{void load();},[load]);

  const resultLabel=ar?`${formatLatinNumber(total,"ar")} موهبة`:`${formatLatinNumber(total,"en")} talent${total===1?"":"s"}`;
  const apply=()=>{setFilters({...draft,page:1});setFiltersOpen(false);};
  const clear=()=>{setDraft(EMPTY);setFilters(EMPTY);setFiltersOpen(false);};
  const numeric=(value:string)=>toLatinDigits(value).replace(/[^0-9]/g,"");

  const header=<View style={s.header}>
    <View style={[s.brandRow,rtl&&s.rowRtl]}><View style={s.flex}><Text style={[s.brand,txt(rtl)]}>{ar?"ملامح للأعمال":"MLAMH FOR BUSINESS"}</Text><Text style={[s.title,txt(rtl)]}>{ar?"اكتشف المواهب":"Discover talent"}</Text><Text style={[s.subtitle,txt(rtl)]}>{ar?"ابحث باحتراف بدون كشف بيانات التواصل الخاصة. الوصول يتدرج حسب الثقة وسياق المشروع.":"Professional discovery without exposing private contact details. Access expands with trust and project context."}</Text></View><View style={s.shield}><ShieldCheck size={22} color={darkTheme.accent}/></View></View>
    <View style={[s.searchRow,rtl&&s.rowRtl]}><View style={[s.searchBox,rtl&&s.rowRtl]}><Search size={18} color={darkTheme.muted}/><TextInput value={draft.q??""} onChangeText={(q)=>setDraft((x)=>({...x,q}))} onSubmitEditing={apply} placeholder={ar?"الاسم، المدينة أو المهارة":"Name, city or skill"} placeholderTextColor={darkTheme.muted} style={[s.searchInput,txt(rtl)]}/></View><Pressable onPress={()=>setFiltersOpen((x)=>!x)} style={[s.filterBtn,filtersOpen&&s.filterBtnActive]}><Filter size={18} color={filtersOpen?darkTheme.background:darkTheme.accent}/></Pressable></View>
    <View style={[s.chips,rtl&&s.rowRtl]}>{(["","actor","model"] as const).map((v)=><Pressable key={v||"all"} onPress={()=>{const next={...draft,category:v,page:1};setDraft(next);setFilters(next);}} style={[s.chip,draft.category===v&&s.chipActive]}><Text style={[s.chipText,draft.category===v&&s.chipTextActive]}>{v==="actor"?(ar?"ممثلون":"Actors"):v==="model"?(ar?"مودلز":"Models"):(ar?"الكل":"All")}</Text></Pressable>)}<Text style={[s.count,txt(rtl)]}>{resultLabel}</Text></View>
    {filtersOpen?<View style={s.filterPanel}>
      <View style={[s.two,rtl&&s.rowRtl]}><Field value={draft.city??""} onChange={(city)=>setDraft((x)=>({...x,city}))} placeholder={ar?"المدينة":"City"} rtl={rtl}/><Field value={draft.nationality??""} onChange={(nationality)=>setDraft((x)=>({...x,nationality}))} placeholder={ar?"الجنسية":"Nationality"} rtl={rtl}/></View>
      <View style={[s.chips,rtl&&s.rowRtl]}>{(["","male","female"] as const).map((v)=><Pressable key={v||"any"} onPress={()=>setDraft((x)=>({...x,gender:v}))} style={[s.chip,draft.gender===v&&s.chipActive]}><Text style={[s.chipText,draft.gender===v&&s.chipTextActive]}>{v==="male"?(ar?"ذكر":"Male"):v==="female"?(ar?"أنثى":"Female"):(ar?"أي جنس":"Any gender")}</Text></Pressable>)}</View>
      <Text style={[s.filterLabel,txt(rtl)]}>{ar?"العمر":"Age"}</Text><View style={[s.two,rtl&&s.rowRtl]}><Field value={draft.ageMin??""} onChange={(ageMin)=>setDraft((x)=>({...x,ageMin:numeric(ageMin)}))} placeholder={ar?"من":"Min"} rtl={rtl} technical/><Field value={draft.ageMax??""} onChange={(ageMax)=>setDraft((x)=>({...x,ageMax:numeric(ageMax)}))} placeholder={ar?"إلى":"Max"} rtl={rtl} technical/></View>
      <View style={[s.actions,rtl&&s.rowRtl]}><Pressable onPress={apply} style={s.primary}><Text style={s.primaryText}>{ar?"عرض النتائج":"Show results"}</Text></Pressable><Pressable onPress={clear} style={s.secondary}><Text style={s.secondaryText}>{ar?"مسح":"Clear"}</Text></Pressable></View>
    </View>:null}
  </View>;

  return <View style={s.screen}><FlatList
    data={items} keyExtractor={(x)=>String(x.id)} ListHeaderComponent={header}
    renderItem={({item})=><TalentCard item={item} locale={locale}/>} ItemSeparatorComponent={()=><View style={s.sep}/>} contentContainerStyle={s.content}
    ListEmptyComponent={loading?<View style={s.state}><ActivityIndicator color={darkTheme.accent}/><Text style={s.stateText}>{ar?"جارٍ تجهيز المواهب…":"Loading talent…"}</Text></View>:error?<View style={s.state}><Text style={[s.error,txt(rtl)]}>{error}</Text><Pressable onPress={()=>void load()} style={s.secondary}><Text style={s.secondaryText}>{ar?"إعادة المحاولة":"Try again"}</Text></Pressable></View>:<View style={s.state}><Text style={[s.emptyTitle,txt(rtl)]}>{ar?"لا توجد نتائج مطابقة":"No matching talent"}</Text><Text style={[s.subtitle,txt(rtl)]}>{ar?"وسّع البحث أو قلّل عدد الفلاتر.":"Broaden the search or remove a filter."}</Text></View>}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load(1,false);}} tintColor={darkTheme.accent}/>
    onEndReached={()=>{if(!loading&&!loadingMore&&page<totalPages)void load(page+1,true);}} onEndReachedThreshold={0.3}
    ListFooterComponent={loadingMore?<ActivityIndicator style={s.loader} color={darkTheme.accent}/>:<View style={{height:18}}/>} showsVerticalScrollIndicator={false}/>
    <PublisherTabBar active="talents" locale={locale}/>
  </View>;
}

function TalentCard({item,locale}:{item:MobilePublicTalent;locale:"ar"|"en"}){
  const ar=locale==="ar",rtl=ar;
  const facts=[item.city,item.age!=null?(ar?`${formatLatinNumber(item.age,"ar")} سنة`:`${formatLatinNumber(item.age,"en")} yrs`):null,item.heightCm!=null?`${formatLatinNumber(item.heightCm,locale)} cm`:null].filter(Boolean).join(" · ");
  return <Pressable onPress={()=>router.push(`/talents/${encodeURIComponent(item.slug)}`)} style={({pressed})=>[s.card,pressed&&s.pressed]}>
    <View style={s.photoWrap}>{item.imageUrl?<Image source={{uri:item.imageUrl}} style={s.photo} resizeMode="cover"/>:<View style={s.photoFallback}><Text style={s.photoInitial}>{item.name.slice(0,1).toUpperCase()}</Text></View>}{item.featured?<View style={s.featured}><Text style={s.featuredText}>{ar?"مميز":"FEATURED"}</Text></View>:null}</View>
    <View style={[s.cardBody,{alignItems:rtl?"flex-end":"flex-start"}]}><View style={[s.nameRow,rtl&&s.rowRtl]}><Text numberOfLines={2} style={[s.name,txt(rtl)]}>{item.name}</Text>{item.verified?<View style={s.verified}><ShieldCheck size={12} color={darkTheme.accent}/><Text style={s.verifiedText}>{ar?"معتمد":"Verified"}</Text></View>:null}</View><Text style={[s.role,txt(rtl)]}>{item.role==="actor"?(ar?"ممثل":"Actor"):(ar?"مودل":"Model")}</Text>{facts?<Text numberOfLines={2} style={[s.facts,txt(rtl)]}>{facts}</Text>:null}{item.bio?<Text numberOfLines={2} style={[s.bio,txt(rtl)]}>{item.bio}</Text>:null}<View style={s.privacyLine}/><View style={[s.cardFooter,rtl&&s.rowRtl]}><Text style={[s.privateHint,txt(rtl)]}>{ar?"بيانات التواصل محمية":"Contact details protected"}</Text><Text style={s.view}>{ar?"عرض الملف":"View profile"}</Text></View></View>
  </Pressable>;
}
function Field({value,onChange,placeholder,rtl,technical=false}:{value:string;onChange:(v:string)=>void;placeholder:string;rtl:boolean;technical?:boolean}){return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={darkTheme.muted} textAlign={technical?"left":rtl?"right":"left"} style={[s.field,technical?{writingDirection:"ltr"}:txt(rtl)]}/>}
function txt(rtl:boolean){return{textAlign:rtl?"right" as const:"left" as const,writingDirection:rtl?"rtl" as const:"ltr" as const}}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{paddingHorizontal:16,paddingTop:16,paddingBottom:108},header:{gap:14,marginBottom:18},brandRow:{flexDirection:"row",gap:12,alignItems:"flex-start"},rowRtl:{flexDirection:"row-reverse"},flex:{flex:1},brand:{color:darkTheme.accent,fontSize:11,fontWeight:"900"},title:{color:darkTheme.text,fontSize:28,lineHeight:34,fontWeight:"900",marginTop:4},subtitle:{color:darkTheme.muted,fontSize:12,lineHeight:19},shield:{width:44,height:44,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620D",alignItems:"center",justifyContent:"center"},searchRow:{flexDirection:"row",gap:8},searchBox:{flex:1,minHeight:50,borderWidth:1,borderColor:darkTheme.border,borderRadius:15,backgroundColor:darkTheme.surface,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:8},searchInput:{flex:1,color:darkTheme.text,fontSize:14},filterBtn:{width:50,height:50,borderRadius:15,borderWidth:1,borderColor:"#C9A96255",alignItems:"center",justifyContent:"center"},filterBtnActive:{backgroundColor:darkTheme.accent},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,alignItems:"center"},chip:{minHeight:36,borderRadius:999,borderWidth:1,borderColor:darkTheme.border,paddingHorizontal:12,alignItems:"center",justifyContent:"center"},chipActive:{borderColor:darkTheme.accent,backgroundColor:"#C9A96212"},chipText:{color:darkTheme.muted,fontSize:10,fontWeight:"800"},chipTextActive:{color:darkTheme.accent},count:{marginStart:"auto",color:darkTheme.muted,fontSize:10},filterPanel:{gap:12,padding:14,borderWidth:1,borderColor:darkTheme.border,borderRadius:18,backgroundColor:darkTheme.surface},two:{flexDirection:"row",gap:8},field:{flex:1,minHeight:46,borderWidth:1,borderColor:darkTheme.border,borderRadius:13,backgroundColor:darkTheme.background,color:darkTheme.text,paddingHorizontal:12},filterLabel:{color:darkTheme.muted,fontSize:11,fontWeight:"700"},actions:{flexDirection:"row",gap:8},primary:{flex:1,minHeight:44,borderRadius:13,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center"},primaryText:{color:darkTheme.background,fontWeight:"900"},secondary:{minHeight:44,borderRadius:13,borderWidth:1,borderColor:darkTheme.border,paddingHorizontal:14,alignItems:"center",justifyContent:"center"},secondaryText:{color:darkTheme.text,fontWeight:"800"},sep:{height:12},card:{height:210,borderWidth:1,borderColor:darkTheme.border,borderRadius:22,backgroundColor:darkTheme.surface,overflow:"hidden",flexDirection:"row"},pressed:{opacity:.72},photoWrap:{width:142,height:"100%",position:"relative",backgroundColor:darkTheme.background},photo:{width:"100%",height:"100%"},photoFallback:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"#C9A9620A"},photoInitial:{color:darkTheme.accent,fontSize:34,fontWeight:"900"},featured:{position:"absolute",top:10,left:10,borderRadius:999,backgroundColor:darkTheme.accent,paddingHorizontal:8,paddingVertical:4},featuredText:{color:darkTheme.background,fontSize:8,fontWeight:"900"},cardBody:{flex:1,minWidth:0,padding:14,gap:5,justifyContent:"center"},nameRow:{width:"100%",flexDirection:"row",alignItems:"center",gap:7},name:{flex:1,color:darkTheme.text,fontSize:17,fontWeight:"900"},verified:{flexDirection:"row",alignItems:"center",gap:3,borderWidth:1,borderColor:"#C9A96255",borderRadius:999,paddingHorizontal:6,paddingVertical:3},verifiedText:{color:darkTheme.accent,fontSize:7,fontWeight:"900"},role:{width:"100%",color:darkTheme.accent,fontSize:11,fontWeight:"800"},facts:{width:"100%",color:darkTheme.text,fontSize:10,lineHeight:16},bio:{width:"100%",color:darkTheme.muted,fontSize:10,lineHeight:16},privacyLine:{width:"100%",height:1,backgroundColor:darkTheme.border,marginTop:3},cardFooter:{width:"100%",flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:2},privateHint:{flex:1,color:darkTheme.muted,fontSize:8},view:{color:darkTheme.accent,fontSize:10,fontWeight:"900"},state:{minHeight:220,alignItems:"center",justifyContent:"center",gap:12,padding:24},stateText:{color:darkTheme.muted},error:{color:"#E59A9A",fontSize:12},emptyTitle:{color:darkTheme.text,fontSize:16,fontWeight:"800"},loader:{marginVertical:18}});
