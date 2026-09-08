import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Headphones, ShieldCheck } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import { createSupportTicket } from "@/lib/api";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

const CATEGORIES = [
  { value: "general_inquiry", ar: "استفسار عام", en: "General inquiry" },
  { value: "technical_issue", ar: "مشكلة تقنية", en: "Technical issue" },
  { value: "account_issue", ar: "مشكلة في الحساب", en: "Account issue" },
  { value: "opportunity_issue", ar: "مشكلة في فرصة", en: "Opportunity issue" },
  { value: "complaint", ar: "شكوى", en: "Complaint" },
  { value: "suggestion", ar: "اقتراح", en: "Suggestion" },
  { value: "report", ar: "بلاغ", en: "Report" },
  { value: "other", ar: "أخرى", en: "Other" },
] as const;

export default function SupportScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isArabic;
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = useMemo(() => createStyles(darkTheme), []);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("general_inquiry");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.auth.getUser(),
      getMobileAccountContext().catch(() => null),
    ]).then(([authResult, account]) => {
      if (!active || !authResult.data.user) return;
      const user = authResult.data.user;
      const metadata = user.user_metadata ?? {};
      setName(String(account?.displayName ?? metadata.full_name ?? metadata.name ?? ""));
      setEmail(user.email ?? "");
      setPhone(account?.phone ?? "");
    });
    return () => { active = false; };
  }, []);

  async function submit() {
    if (submitting) return;
    setError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (cleanName.length < 2 || cleanEmail.length < 3 || cleanSubject.length < 3 || !cleanMessage) {
      setError(isArabic ? "أكمل الاسم والبريد وعنوان الطلب والتفاصيل." : "Complete your name, email, subject and details.");
      return;
    }
    setSubmitting(true);
    const result = await createSupportTicket({ senderName: cleanName, senderEmail: cleanEmail, senderPhone: phone.trim() || null, category, subject: cleanSubject, message: cleanMessage, locale });
    setSubmitting(false);
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/support" } }); return; }
      const messages: Record<string, string> = {
        RATE_LIMIT: isArabic ? "أرسلت عدة طلبات خلال وقت قصير. حاول مرة أخرى بعد قليل." : "Too many requests were sent recently. Please try again later.",
        INVALID_INPUT: isArabic ? "راجع البيانات المدخلة ثم حاول مرة أخرى." : "Review the entered details and try again.",
      };
      setError(messages[result.code] ?? (isArabic ? "تعذر إرسال الطلب الآن. حاول مرة أخرى." : "Unable to send your request right now. Please try again."));
      return;
    }
    setTicketNumber(result.ticketNumber || "—");
  }

  function reset() {
    setTicketNumber(null); setSubject(""); setMessage(""); setCategory("general_inquiry"); setError(null);
  }

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.top, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={21} color={darkTheme.text}/></Pressable><Text style={[styles.brand, isArabic && styles.noTracking]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>

        <View style={[styles.hero, isRtl && styles.rowRtl]}><View style={styles.heroIcon}><Headphones size={22} color={darkTheme.accent}/></View><View style={styles.heroCopy}><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isRtl && styles.textRtl]}>{isArabic ? "الدعم والشكاوى" : "Support & complaints"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "أرسل طلبك من داخل التطبيق. يتم تسجيله كتذكرة واحدة يمكن لفريق ملامح متابعتها." : "Send your request without leaving the app. It becomes one tracked MLAMH support ticket."}</Text></View></View>

        {ticketNumber ? <View style={styles.successCard}><View style={styles.successIcon}><CheckCircle2 size={26} color="#49C991"/></View><Text style={[styles.successTitle, isRtl && styles.textRtl]}>{isArabic ? "تم إرسال طلبك" : "Your request was sent"}</Text><Text style={[styles.successBody, isRtl && styles.textRtl]}>{isArabic ? "احتفظ برقم التذكرة للرجوع إلى طلبك مع فريق الدعم." : "Keep the ticket number to reference your request with support."}</Text><View style={styles.ticketBox}><Text style={styles.ticketNumber}>{ticketNumber}</Text></View><Pressable onPress={reset} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{isArabic ? "إرسال طلب آخر" : "Send another request"}</Text></Pressable></View> : <>
          <View style={[styles.trustCard, isRtl && styles.rowRtl]}><ShieldCheck size={20} color={darkTheme.accent}/><Text style={[styles.trustText, isRtl && styles.textRtl]}>{isArabic ? "هذه هي نفس منظومة الدعم المستخدمة في موقع ملامح، لكن بتجربة أصلية داخل التطبيق." : "This uses the same MLAMH support ticket system as the website, with a native in-app experience."}</Text></View>

          <View style={styles.formCard}>
            <Text style={[styles.requiredLegend, isRtl && styles.textRtl]}><Text style={styles.requiredMark}>*</Text> {isArabic ? "حقل مطلوب" : "Required field"}</Text>
            <Field label={isArabic ? "الاسم" : "Name"} value={name} onChangeText={setName} isRtl={isRtl} required/>
            <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" ltr isRtl={isRtl} required/>
            <Field label={isArabic ? "رقم الجوال — اختياري" : "Mobile number — optional"} value={phone} onChangeText={setPhone} keyboardType="phone-pad" ltr isRtl={isRtl}/>

            <Text style={[styles.label, isRtl && styles.textRtl]}>{isArabic ? "نوع الطلب" : "Request type"}</Text>
            <View style={[styles.categories, isRtl && styles.categoriesRtl]}>{CATEGORIES.map((item) => { const active = category === item.value; return <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.categoryChip, active && styles.categoryChipActive]}><Text style={[styles.categoryText, active && styles.categoryTextActive]}>{isArabic ? item.ar : item.en}</Text></Pressable>; })}</View>

            <Field label={isArabic ? "عنوان الطلب" : "Subject"} value={subject} onChangeText={setSubject} isRtl={isRtl} required/>
            <View style={styles.fieldWrap}><Text style={[styles.label, isRtl && styles.textRtl]}>{isArabic ? "التفاصيل" : "Details"} <Text style={styles.requiredMark}>*</Text></Text><TextInput value={message} onChangeText={setMessage} multiline maxLength={10000} placeholder={isArabic ? "اشرح المشكلة أو الطلب بالتفصيل..." : "Describe the issue or request in detail..."} placeholderTextColor={darkTheme.muted} textAlignVertical="top" style={[styles.input, styles.textArea, isRtl && styles.textRtl]}/><Text style={styles.characterCount}>{message.length}/10000</Text></View>
          </View>

          {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.errorText, isRtl && styles.textRtl]}>{error}</Text></View> : null}
          <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submitButton, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color={darkTheme.background}/> : <Text style={styles.submitText}>{isArabic ? "إرسال الطلب" : "Send request"}</Text>}</Pressable>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Field({ label, ltr, isRtl, required, ...props }: { label: string; ltr?: boolean; isRtl?: boolean; required?: boolean } & React.ComponentProps<typeof TextInput>) {
  const rtl = Boolean(isRtl);
  return <View style={stylesStatic.fieldWrap}><Text style={[stylesStatic.label, rtl && stylesStatic.labelRtl]}>{label}{required ? <Text style={stylesStatic.requiredMark}> *</Text> : null}</Text><TextInput placeholderTextColor="#8F8F89" style={[stylesStatic.input, rtl && !ltr && stylesStatic.textRtl, ltr && stylesStatic.ltr, rtl && ltr && stylesStatic.ltrRtl]} {...props}/></View>;
}

const stylesStatic = StyleSheet.create({ fieldWrap:{gap:7},label:{color:"#F5F5F0",fontSize:12,fontWeight:"800"},labelRtl:{textAlign:"right",writingDirection:"rtl"},requiredMark:{color:"#C9A962"},textRtl:{textAlign:"right",writingDirection:"rtl"},input:{minHeight:52,borderWidth:1,borderColor:"#FFFFFF18",borderRadius:14,color:"#F5F5F0",fontSize:14,paddingHorizontal:14,paddingVertical:11,backgroundColor:"#0C0C0C"},ltr:{writingDirection:"ltr"},ltrRtl:{textAlign:"right"} });

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:680,alignSelf:"center",paddingHorizontal:20,paddingTop:8,paddingBottom:36,gap:16},contentCompact:{paddingHorizontal:14,gap:13},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:50},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},noTracking:{letterSpacing:0},backButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:theme.surface},brand:{color:theme.accent,fontSize:15,fontWeight:"900",letterSpacing:1.5},hero:{flexDirection:"row",alignItems:"flex-start",gap:12,borderWidth:1,borderColor:"#C9A96233",borderRadius:22,backgroundColor:"#C9A96208",padding:16},heroIcon:{width:46,height:46,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center"},heroCopy:{flex:1,gap:4},title:{color:theme.text,fontSize:27,lineHeight:33,fontWeight:"900"},titleCompact:{fontSize:24,lineHeight:30},subtitle:{color:theme.muted,fontSize:12,lineHeight:19},trustCard:{flexDirection:"row",alignItems:"flex-start",gap:10,borderWidth:1,borderColor:"#C9A96222",borderRadius:16,padding:13,backgroundColor:theme.surface},trustText:{flex:1,color:theme.muted,fontSize:11,lineHeight:18},formCard:{gap:15,borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15},requiredLegend:{color:theme.muted,fontSize:10,fontWeight:"700"},requiredMark:{color:theme.accent},fieldWrap:{gap:7},label:{color:theme.text,fontSize:12,fontWeight:"800"},input:{minHeight:52,borderWidth:1,borderColor:theme.border,borderRadius:14,color:theme.text,fontSize:14,paddingHorizontal:14,paddingVertical:11,backgroundColor:"#0C0C0C"},textArea:{minHeight:150},characterCount:{alignSelf:"flex-end",color:theme.muted,fontSize:9},categories:{flexDirection:"row",flexWrap:"wrap",gap:7},categoriesRtl:{flexDirection:"row-reverse"},categoryChip:{minHeight:38,borderRadius:19,borderWidth:1,borderColor:theme.border,paddingHorizontal:12,alignItems:"center",justifyContent:"center"},categoryChipActive:{backgroundColor:theme.accent,borderColor:theme.accent},categoryText:{color:theme.muted,fontSize:10,fontWeight:"800"},categoryTextActive:{color:theme.background},errorBox:{borderWidth:1,borderColor:"#C84F4F55",backgroundColor:"#C84F4F12",borderRadius:14,padding:12},errorText:{color:"#E59A9A",fontSize:12,lineHeight:18},submitButton:{minHeight:54,borderRadius:14,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},submitText:{color:theme.background,fontSize:15,fontWeight:"900"},disabled:{opacity:.45},successCard:{borderWidth:1,borderColor:"#49C99144",backgroundColor:"#49C99109",borderRadius:22,padding:22,gap:10,alignItems:"center"},successIcon:{width:54,height:54,borderRadius:27,borderWidth:1,borderColor:"#49C99144",alignItems:"center",justifyContent:"center"},successTitle:{color:theme.text,fontSize:21,fontWeight:"900",textAlign:"center"},successBody:{color:theme.muted,fontSize:12,lineHeight:19,textAlign:"center"},ticketBox:{marginVertical:5,borderWidth:1,borderColor:"#C9A96255",backgroundColor:"#00000044",borderRadius:14,paddingHorizontal:18,paddingVertical:12},ticketNumber:{color:theme.accent,fontSize:17,fontWeight:"900",letterSpacing:.8},secondaryButton:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,paddingHorizontal:18,alignItems:"center",justifyContent:"center"},secondaryButtonText:{color:theme.text,fontSize:13,fontWeight:"800"}
}); }
