import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Images, ShieldCheck, X } from "lucide-react-native";

import { displayValue, displayValues } from "@/lib/display-values";
import { formatLatinNumber, isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getPublisherDashboard, type MobilePublisherOpportunity } from "@/lib/publisher-api";
import { inviteTalentToOpportunity } from "@/lib/talent-invitations";
import { darkTheme, radii, spacing, typography } from "@/lib/theme";
import { getMobileTalent, type MobilePublicTalent } from "@/lib/talents";

export default function TalentProfileScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { locale } = useAppLocale();
  const ar = locale === "ar";
  const rtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const Back = rtl ? ChevronRight : ChevronLeft;
  const [item, setItem] = useState<MobilePublicTalent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<MobilePublisherOpportunity[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [publisherLoaded, setPublisherLoaded] = useState(false);
  const [inviteBusy, setInviteBusy] = useState<number | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!slug) { setError(ar ? "ملف الموهبة غير متاح." : "Talent profile is unavailable."); setLoading(false); return; }
      try {
        const [talent, dashboard] = await Promise.all([
          getMobileTalent(locale, slug),
          getPublisherDashboard(locale).catch(() => null),
        ]);
        if (!active) return;
        setItem(talent);
        setOpportunities((dashboard?.opportunities ?? []).filter((opportunity) => opportunity.published || opportunity.status === "published"));
      } catch {
        if (active) setError(ar ? "تعذر تحميل ملف الموهبة." : "We couldn't load this talent profile.");
      } finally {
        if (active) { setLoading(false); setPublisherLoaded(true); }
      }
    })();
    return () => { active = false; };
  }, [ar, locale, slug]);

  if (loading) return <View style={s.center}><ActivityIndicator color={darkTheme.accent} /><Text style={s.muted}>{ar ? "جارٍ تحميل الملف…" : "Loading profile…"}</Text></View>;
  if (!item || error) return <View style={s.center}><Text style={s.error}>{error ?? (ar ? "الملف غير متاح" : "Profile unavailable")}</Text><Pressable onPress={() => router.back()} style={s.primary}><Text style={s.primaryText}>{ar ? "رجوع" : "Go back"}</Text></Pressable></View>;

  const talentId = item.id;
  const role = displayValue(item.role, locale) ?? (ar ? "موهبة" : "Talent");
  const country = displayValue(item.countryCode, locale);
  const facts = [item.city, country, item.age != null ? (ar ? `${formatLatinNumber(item.age, locale)} سنة` : `${formatLatinNumber(item.age, locale)} yrs`) : null, item.heightCm != null ? `${formatLatinNumber(item.heightCm, locale)} cm` : null].filter((value): value is string => Boolean(value));
  const gallery = [item.imageUrl, ...(item.galleryImages ?? [])].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);
  const languages = displayValues(item.languages, locale), dialects = displayValues(item.dialects, locale), skills = displayValues(item.skills, locale);
  const details = [
    { label: ar ? "الخبرة" : "Experience", value: item.experienceYears != null ? (ar ? `${formatLatinNumber(item.experienceYears, locale)} سنة` : `${formatLatinNumber(item.experienceYears, locale)} years`) : null },
    { label: ar ? "التوفر" : "Availability", value: displayValue(item.availabilityStatus, locale) },
    { label: ar ? "السفر" : "Travel", value: item.readyToTravel == null ? null : item.readyToTravel ? (ar ? "متاح للسفر" : "Open to travel") : (ar ? "غير متاح للسفر" : "Not available for travel") },
  ].filter((entry) => entry.value);

  function openInvite() {
    setInviteMessage(null);
    if (!publisherLoaded) return;
    if (opportunities.length === 0) { router.push("/publisher/opportunities/new"); return; }
    setInviteOpen(true);
  }

  async function sendInvite(opportunity: MobilePublisherOpportunity) {
    if (inviteBusy !== null) return;
    setInviteBusy(opportunity.id); setInviteMessage(null);
    const result = await inviteTalentToOpportunity(opportunity.id, talentId, locale);
    setInviteBusy(null);
    if (result.ok) {
      setInviteOpen(false);
      setInviteMessage(result.alreadyInvited
        ? (ar ? "سبق أن دعوت هذه الموهبة إلى الفرصة." : "This talent has already been invited to the opportunity.")
        : (ar ? "تم إرسال الدعوة إلى الموهبة." : "Invitation sent to the talent."));
      return;
    }
    const messages: Record<string, { ar: string; en: string }> = {
      FORBIDDEN: { ar: "يجب أن يكون حساب الناشر معتمدًا لإرسال الدعوات.", en: "Your publisher account must be approved to send invitations." },
      OPPORTUNITY_NOT_PUBLISHED: { ar: "يمكن إرسال الدعوة فقط إلى فرصة منشورة.", en: "Invitations can only be sent for a published opportunity." },
      TALENT_NOT_FOUND: { ar: "هذه الموهبة لم تعد متاحة للدعوة.", en: "This talent is no longer available for invitation." },
    };
    setInviteMessage((messages[result.code] ?? { ar: "تعذر إرسال الدعوة الآن.", en: "Unable to send the invitation right now." })[locale]);
  }

  return <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.topRow, rtl && s.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={ar ? "رجوع" : "Back"} onPress={() => router.back()} style={s.iconButton}><Back size={21} color={darkTheme.text} /></Pressable><Text style={[s.brand, txt(rtl)]}>{ar ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text></View>

      <View style={s.heroCard}>
        <Pressable accessibilityRole="button" accessibilityLabel={ar ? "فتح الصورة" : "Open photo"} onPress={() => gallery.length && setGalleryIndex(0)} style={s.heroImageWrap}>{item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={s.heroImage} resizeMode="cover" /> : <View style={s.imageFallback}><Text style={s.imageInitial}>{item.name.slice(0, 1).toUpperCase()}</Text></View>}<View style={[s.photoCount, rtl && s.photoCountRtl]}><Images size={14} color={darkTheme.text} /><Text style={s.photoCountText}>{formatLatinNumber(gallery.length, locale)}</Text></View></Pressable>
        <View style={[s.identity, { alignItems: rtl ? "flex-end" : "flex-start" }]}><View style={[s.nameRow, rtl && s.rowRtl]}><Text accessibilityRole="header" style={[s.name, txt(rtl)]}>{item.name}</Text>{item.verified ? <View style={s.verified}><ShieldCheck size={13} color={darkTheme.accent} /><Text style={s.verifiedText}>{ar ? "معتمد" : "Verified"}</Text></View> : null}</View><Text style={[s.role, txt(rtl)]}>{role}</Text><View style={[s.factRow, rtl && s.rowRtl]}>{facts.map((fact) => <View key={fact} style={s.factChip}><Text style={[s.factText, txt(rtl)]}>{fact}</Text></View>)}</View></View>
      </View>

      {gallery.length > 1 ? <Section title={ar ? "معرض الصور" : "Gallery"} rtl={rtl}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.galleryRow, rtl && s.galleryRowRtl]}>{gallery.map((url, index) => <Pressable key={`${url}-${index}`} onPress={() => setGalleryIndex(index)} style={s.galleryPress}><Image source={{ uri: url }} style={s.galleryImage} resizeMode="cover" /></Pressable>)}</ScrollView></Section> : null}
      {item.bio ? <Section title={ar ? "نبذة" : "About"} rtl={rtl}><Text style={[s.body, txt(rtl)]}>{item.bio}</Text></Section> : null}
      {details.length ? <Section title={ar ? "معلومات مهنية" : "Professional details"} rtl={rtl}><View>{details.map((entry) => <View key={entry.label} style={[s.detailRow, rtl && s.rowRtl]}><Text style={[s.detailLabel, txt(rtl)]}>{entry.label}</Text><Text style={[s.detailValue, txt(rtl)]}>{entry.value}</Text></View>)}</View></Section> : null}
      {languages.length || dialects.length ? <Section title={ar ? "اللغات واللهجات" : "Languages & dialects"} rtl={rtl}><ChipList values={[...languages, ...dialects]} rtl={rtl} /></Section> : null}
      {skills.length ? <Section title={ar ? "المهارات" : "Skills"} rtl={rtl}><ChipList values={skills} rtl={rtl} /></Section> : null}

      <View style={[s.privacyNote, rtl && s.rowRtl]}><ShieldCheck size={18} color={darkTheme.accent} /><View style={s.flex}><Text style={[s.privacyTitle, txt(rtl)]}>{ar ? "خصوصية الموهبة" : "Talent privacy"}</Text><Text style={[s.privacyBody, txt(rtl)]}>{ar ? "وسائل التواصل والمحتوى الخاص لا تظهر في التصفح. التواصل يتم ضمن دورة الفرصة داخل ملامح." : "Private contact details and private media stay protected. Connection happens inside the opportunity workflow."}</Text></View></View>
      {inviteMessage ? <View style={[s.messageBox, inviteMessage.includes(ar ? "تم إرسال" : "Invitation sent") && s.successBox]}><CheckCircle2 size={16} color={darkTheme.accent}/><Text style={[s.messageText, txt(rtl)]}>{inviteMessage}</Text></View> : null}
      <Pressable accessibilityRole="button" onPress={openInvite} style={s.primary}><BriefcaseBusiness size={18} color={darkTheme.background} /><Text style={s.primaryText}>{opportunities.length > 0 ? (ar ? "دعوة إلى فرصة" : "Invite to an opportunity") : (ar ? "أنشئ فرصة منشورة أولًا" : "Create a published opportunity first")}</Text></Pressable>
      <Text style={[s.ctaHint, txt(rtl)]}>{opportunities.length > 0 ? (ar ? "اختر إحدى فرصك المنشورة وسيصل للموهبة إشعار مباشر بالفرصة." : "Choose one of your published opportunities and the talent will receive an invitation notification.") : (ar ? "لا توجد لديك فرصة منشورة يمكن ربط الدعوة بها." : "You don't have a published opportunity to attach an invitation to yet.")}</Text>
    </ScrollView>

    <Modal visible={galleryIndex !== null} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setGalleryIndex(null)}><SafeAreaView style={s.viewer} edges={["top", "bottom"]}><View style={[s.viewerTop, rtl && s.rowRtl]}><Text style={s.viewerCount}>{galleryIndex !== null ? `${formatLatinNumber(galleryIndex + 1, locale)} / ${formatLatinNumber(gallery.length, locale)}` : ""}</Text><Pressable onPress={() => setGalleryIndex(null)} style={s.viewerClose}><X size={22} color={darkTheme.text} /></Pressable></View><FlatList horizontal pagingEnabled data={gallery} initialScrollIndex={galleryIndex ?? 0} getItemLayout={(_, index) => ({ length: width, offset: width * index, index })} keyExtractor={(url, index) => `${url}-${index}`} onMomentumScrollEnd={(event) => { const pageWidth = event.nativeEvent.layoutMeasurement.width; if (pageWidth > 0) setGalleryIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth)); }} renderItem={({ item: url }) => <View style={[s.viewerPage,{width}]}><Image source={{ uri: url }} style={s.viewerImage} resizeMode="contain" /></View>} showsHorizontalScrollIndicator={false} /></SafeAreaView></Modal>

    <Modal visible={inviteOpen} animationType="slide" transparent onRequestClose={() => setInviteOpen(false)}><View style={s.sheetBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => inviteBusy === null && setInviteOpen(false)} /><SafeAreaView style={s.sheet} edges={["bottom"]}><View style={[s.sheetHeader, rtl && s.rowRtl]}><View style={s.flex}><Text style={[s.sheetTitle, txt(rtl)]}>{ar ? "اختر الفرصة" : "Choose opportunity"}</Text><Text style={[s.sheetSubtitle, txt(rtl)]}>{ar ? `اختر الفرصة المنشورة التي تريد دعوة ${item.name} إليها.` : `Choose the published opportunity you want to invite ${item.name} to.`}</Text></View><Pressable disabled={inviteBusy !== null} onPress={() => setInviteOpen(false)} style={s.viewerClose}><X size={20} color={darkTheme.text} /></Pressable></View><ScrollView contentContainerStyle={s.opportunityList}>{opportunities.map((opportunity) => <Pressable disabled={inviteBusy !== null} key={opportunity.id} onPress={() => void sendInvite(opportunity)} style={[s.opportunityRow,inviteBusy!==null&&s.disabled]}><View style={s.flex}><Text style={[s.opportunityTitle, txt(rtl)]}>{opportunity.title}</Text><Text style={[s.opportunityStatus, txt(rtl)]}>{ar ? "منشورة" : "Published"}</Text></View>{inviteBusy===opportunity.id?<ActivityIndicator color={darkTheme.accent}/>:<BriefcaseBusiness size={18} color={darkTheme.accent}/>}</Pressable>)}</ScrollView>{inviteMessage?<Text style={[s.sheetError,txt(rtl)]}>{inviteMessage}</Text>:null}</SafeAreaView></View></Modal>
  </SafeAreaView>;
}

function Section({ title, rtl, children }: { title: string; rtl: boolean; children: React.ReactNode }) { return <View style={s.section}><Text style={[s.sectionTitle, txt(rtl)]}>{title}</Text>{children}</View>; }
function ChipList({ values, rtl }: { values: string[]; rtl: boolean }) { return <View style={[s.chipList, rtl && s.rowRtl]}>{values.map((value) => <View key={value} style={s.chip}><Text style={[s.chipText, txt(rtl)]}>{value}</Text></View>)}</View>; }
function txt(rtl: boolean) { return { textAlign: rtl ? "right" as const : "left" as const, writingDirection: rtl ? "rtl" as const : "ltr" as const }; }
const s = StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{width:"100%",maxWidth:700,alignSelf:"center",paddingHorizontal:spacing.lg,paddingTop:spacing.xs,paddingBottom:spacing.xxl,gap:spacing.lg},center:{flex:1,backgroundColor:darkTheme.background,alignItems:"center",justifyContent:"center",padding:spacing.xl,gap:spacing.md},muted:{color:darkTheme.muted,fontSize:12},error:{color:darkTheme.text,fontSize:17,fontWeight:"800",textAlign:"center"},rowRtl:{flexDirection:"row-reverse"},flex:{flex:1,minWidth:0},topRow:{minHeight:52,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},iconButton:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:darkTheme.border,backgroundColor:darkTheme.surface,alignItems:"center",justifyContent:"center"},brand:{color:darkTheme.accent,fontSize:12,fontWeight:"900"},heroCard:{borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.xl,backgroundColor:darkTheme.surface,overflow:"hidden"},heroImageWrap:{width:"100%",aspectRatio:4/3,backgroundColor:darkTheme.surfaceElevated},heroImage:{width:"100%",height:"100%"},imageFallback:{flex:1,alignItems:"center",justifyContent:"center"},imageInitial:{color:darkTheme.accent,fontSize:58,fontWeight:"900"},photoCount:{position:"absolute",right:12,bottom:12,minHeight:30,borderRadius:15,backgroundColor:"#050505CC",paddingHorizontal:10,flexDirection:"row",alignItems:"center",gap:6},photoCountRtl:{right:undefined,left:12},photoCountText:{color:darkTheme.text,fontSize:10,fontWeight:"900"},identity:{padding:18,gap:7},nameRow:{flexDirection:"row",alignItems:"center",gap:8,maxWidth:"100%"},name:{flexShrink:1,color:darkTheme.text,fontSize:29,lineHeight:36,fontWeight:"900"},verified:{borderWidth:1,borderColor:"#C9A96255",borderRadius:999,paddingHorizontal:8,paddingVertical:4,flexDirection:"row",alignItems:"center",gap:4},verifiedText:{color:darkTheme.accent,fontSize:8,fontWeight:"900"},role:{color:darkTheme.accent,fontSize:12,fontWeight:"900"},factRow:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:5},factChip:{borderWidth:1,borderColor:darkTheme.border,borderRadius:999,paddingHorizontal:10,paddingVertical:7,backgroundColor:darkTheme.background},factText:{color:darkTheme.muted,fontSize:10,fontWeight:"700"},section:{borderTopWidth:1,borderTopColor:darkTheme.border,paddingTop:spacing.md,gap:12},sectionTitle:{...typography.sectionTitle,color:darkTheme.text},body:{...typography.body,color:darkTheme.muted},galleryRow:{gap:10,paddingVertical:2},galleryRowRtl:{minWidth:"100%",justifyContent:"flex-end"},galleryPress:{borderRadius:radii.lg,overflow:"hidden"},galleryImage:{width:128,height:164,borderRadius:radii.lg,backgroundColor:darkTheme.surfaceElevated},detailRow:{minHeight:46,borderBottomWidth:1,borderBottomColor:darkTheme.border,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:16},detailLabel:{color:darkTheme.muted,fontSize:11},detailValue:{color:darkTheme.text,fontSize:11,fontWeight:"800",flexShrink:1},chipList:{flexDirection:"row",flexWrap:"wrap",gap:7},chip:{borderWidth:1,borderColor:darkTheme.border,borderRadius:999,backgroundColor:darkTheme.surface,paddingHorizontal:11,paddingVertical:8},chipText:{color:darkTheme.text,fontSize:10,fontWeight:"700"},privacyNote:{borderWidth:1,borderColor:"#C9A9622E",borderRadius:radii.lg,backgroundColor:"#C9A96208",padding:14,flexDirection:"row",alignItems:"flex-start",gap:10},privacyTitle:{color:darkTheme.accent,fontSize:11,fontWeight:"900"},privacyBody:{color:darkTheme.muted,fontSize:11,lineHeight:18,marginTop:3},messageBox:{borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.md,backgroundColor:darkTheme.surface,padding:12,flexDirection:"row",alignItems:"center",gap:8},successBox:{borderColor:"#49C99155",backgroundColor:"#49C9910C"},messageText:{flex:1,color:darkTheme.text,fontSize:11,lineHeight:18},primary:{minHeight:54,borderRadius:radii.md,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:18,flexDirection:"row",gap:8},primaryText:{color:darkTheme.background,fontSize:14,fontWeight:"900"},ctaHint:{color:darkTheme.muted,fontSize:10,lineHeight:16,marginTop:-12},viewer:{flex:1,backgroundColor:"#000"},viewerTop:{minHeight:54,paddingHorizontal:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},viewerCount:{color:darkTheme.muted,fontSize:11,fontWeight:"800"},viewerClose:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:darkTheme.border,backgroundColor:darkTheme.surface,alignItems:"center",justifyContent:"center"},viewerPage:{flex:1,alignItems:"center",justifyContent:"center"},viewerImage:{width:"100%",height:"100%"},sheetBackdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"#00000088"},sheet:{maxHeight:"72%",backgroundColor:darkTheme.surfaceElevated,borderTopLeftRadius:26,borderTopRightRadius:26,paddingTop:18},sheetHeader:{paddingHorizontal:18,paddingBottom:14,flexDirection:"row",alignItems:"flex-start",gap:12,borderBottomWidth:1,borderBottomColor:darkTheme.border},sheetTitle:{color:darkTheme.text,fontSize:20,fontWeight:"900"},sheetSubtitle:{color:darkTheme.muted,fontSize:11,lineHeight:18,marginTop:4},opportunityList:{padding:14,gap:8},opportunityRow:{minHeight:68,borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.lg,backgroundColor:darkTheme.surface,padding:13,flexDirection:"row",alignItems:"center",gap:10},opportunityTitle:{color:darkTheme.text,fontSize:13,fontWeight:"900"},opportunityStatus:{color:darkTheme.muted,fontSize:9,marginTop:4},sheetError:{color:darkTheme.danger,fontSize:10,lineHeight:16,paddingHorizontal:18,paddingBottom:12},disabled:{opacity:.5}});
