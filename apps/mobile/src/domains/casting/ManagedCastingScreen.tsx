import * as WebBrowser from "expo-web-browser";
import { BriefcaseBusiness, CheckCircle2, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { MobileApiError } from "@/src/api/client";
import { submitManagedCastingRequest } from "@/src/domains/casting/api";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

type TalentType = "actor" | "model" | "mixed";

export function ManagedCastingScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const direction = isArabic ? "rtl" : "ltr";
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [talentType, setTalentType] = useState<TalentType>("actor");
  const [count, setCount] = useState("1");
  const [city, setCity] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [budget, setBudget] = useState("");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id?: number; path?: string } | null>(null);

  async function submit() {
    if (submitting) return;
    setError("");
    if (!clientName.trim() || !projectTitle.trim() || !brief.trim()) {
      setError(isArabic ? "أكمل الاسم واسم المشروع وملخص المشروع." : "Complete your name, project title, and casting brief.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(isArabic ? "أضف بريدًا إلكترونيًا أو رقم تواصل." : "Add an email address or contact number.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitManagedCastingRequest({
        client_name: clientName.trim(),
        company_name: companyName.trim(),
        contact_email: email.trim().toLowerCase(),
        contact_phone: phone.trim(),
        project_title: projectTitle.trim(),
        talent_type: talentType,
        required_count: Math.max(1, Math.min(1000, Number.parseInt(count, 10) || 1)),
        city: city.trim(),
        work_date: workDate.trim(),
        budget: budget.trim(),
        brief: brief.trim(),
        locale,
        company_website: "",
      });
      setSuccess({ id: response.requestId, path: response.trackingPath });
    } catch (cause) {
      setError(cause instanceof MobileApiError && cause.message ? cause.message : (isArabic ? "تعذر إرسال الطلب الآن. حاول مرة أخرى." : "We could not submit your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function openTracking() {
    if (!success?.path) return;
    const url = success.path.startsWith("http") ? success.path : `https://mlamh.net${success.path}`;
    await WebBrowser.openBrowserAsync(url);
  }

  if (success) {
    return <View style={styles.screen}><View style={styles.successWrap}>
      <View style={styles.successIcon}><CheckCircle2 size={28} color={colors.gold} /></View>
      <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "تم استلام ملخص المشروع" : "BRIEF RECEIVED"}</Text>
      <Text style={[styles.successTitle, { textAlign: align, writingDirection: direction }]}>{isArabic ? "بدأنا من هنا." : "We'll take it from here."}</Text>
      <Text style={[styles.successText, { textAlign: align, writingDirection: direction }]}>{isArabic ? "وصل طلبك إلى فريق كاستينغ ملامح. سنراجع الاحتياج قبل أي عرض أو نشر، ونتواصل معك على بيانات التواصل المرسلة." : "Your request is with the MLAMH Casting team. We will review it before any proposal or publication and contact you using the details provided."}</Text>
      {success.id ? <Text style={styles.requestId}>#{success.id}</Text> : null}
      {success.path ? <Pressable onPress={() => void openTracking()} style={styles.goldButton}><Text style={styles.goldButtonText}>{isArabic ? "متابعة حالة الطلب" : "Track request status"}</Text></Pressable> : null}
    </View></View>;
  }

  const steps = isArabic
    ? [["01","أرسل ملخص المشروع"],["02","نبحث ونفرز"],["03","راجع القائمة المختصرة"],["04","نؤكد ونحجز"]]
    : [["01","Send the brief"],["02","We source & screen"],["03","Review the shortlist"],["04","We confirm & book"]];

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={styles.hero}>
      <View style={[styles.badgeRow, isArabic && styles.rowReverse]}><BriefcaseBusiness size={15} color={colors.gold} /><Text style={styles.eyebrow}>كاستينغ ملامح</Text></View>
      <Text style={[styles.title, { textAlign: align, writingDirection: direction }]}>{isArabic ? "من ملخص المشروع إلى موهبة مؤكدة وجاهزة للتنفيذ." : "From brief to confirmed talent, ready to work."}</Text>
      <Text style={[styles.description, { textAlign: align, writingDirection: direction }]}>{isArabic ? "خدمة كاستينغ مُدارة للشركات وجهات الإنتاج والوكالات والعلامات. نتولى تنظيم الاحتياج والبحث والفرز وإعداد القائمة المختصرة، ثم تأكيد المواهب والحجز بعد قرارك." : "Managed casting for companies, production teams, agencies, and brands. We structure the brief, source and screen talent, deliver the shortlist, then coordinate confirmation and booking."}</Text>
    </View>

    <View style={styles.steps}>{steps.map(([number,label]) => <View key={number} style={styles.step}><Text style={styles.stepNo}>{number}</Text><Text style={[styles.stepLabel,{textAlign:align,writingDirection:direction}]}>{label}</Text></View>)}</View>

    <View style={styles.formCard}>
      <View style={[styles.formBadge, isArabic && styles.rowReverse]}><Sparkles size={15} color={colors.gold} /><Text style={styles.eyebrow}>{isArabic ? "ابدأ المشروع" : "START A PROJECT"}</Text></View>
      <Text style={[styles.formTitle,{textAlign:align,writingDirection:direction}]}>{isArabic ? "أرسل احتياج الكاستينغ" : "Send your casting brief"}</Text>
      <Field label={isArabic ? "الاسم *" : "Your name *"} value={clientName} onChangeText={setClientName} isArabic={isArabic} />
      <Field label={isArabic ? "الشركة / الجهة" : "Company / organization"} value={companyName} onChangeText={setCompanyName} isArabic={isArabic} />
      <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} isArabic={false} keyboardType="email-address" />
      <Field label={isArabic ? "رقم التواصل" : "Contact number"} value={phone} onChangeText={setPhone} isArabic={false} keyboardType="phone-pad" />
      <Field label={isArabic ? "اسم المشروع *" : "Project title *"} value={projectTitle} onChangeText={setProjectTitle} isArabic={isArabic} />

      <View style={styles.field}><Text style={[styles.label,{textAlign:align}]}>{isArabic ? "المواهب المطلوبة *" : "Talent needed *"}</Text><View style={[styles.choiceRow,isArabic&&styles.rowReverse]}>{(["actor","model","mixed"] as const).map(value => <Pressable key={value} onPress={()=>setTalentType(value)} style={[styles.choice,talentType===value&&styles.choiceActive]}><Text style={[styles.choiceText,talentType===value&&styles.choiceTextActive]}>{value==="actor"?(isArabic?"ممثلون":"Actors"):value==="model"?(isArabic?"مودلز":"Models"):(isArabic?"ممثلون ومودلز":"Actors & Models")}</Text></Pressable>)}</View></View>
      <View style={[styles.twoCols,isArabic&&styles.rowReverse]}><MiniField label={isArabic?"العدد التقريبي":"Approx. count"} value={count} onChangeText={setCount}/><MiniField label={isArabic?"المدينة":"City"} value={city} onChangeText={setCity} isArabic={isArabic}/></View>
      <Field label={isArabic ? "تاريخ العمل (YYYY-MM-DD)" : "Work date (YYYY-MM-DD)"} value={workDate} onChangeText={setWorkDate} isArabic={false} />
      <Field label={isArabic ? "الميزانية أو نطاق الأجر" : "Budget or compensation range"} value={budget} onChangeText={setBudget} isArabic={isArabic} placeholder={isArabic ? "مثال: 5,000 ريال أو حسب الاتفاق" : "Example: SAR 5,000 or negotiable"} />
      <View style={styles.field}><Text style={[styles.label,{textAlign:align}]}>{isArabic?"ملخص المشروع *":"Casting brief *"}</Text><TextInput value={brief} onChangeText={setBrief} multiline maxLength={5000} textAlignVertical="top" placeholder={isArabic?"اشرح نوع المشروع، الأدوار أو المواصفات المطلوبة، الاستخدام، مكان التصوير، المدة وأي تفاصيل مهمة.":"Describe the project, profiles needed, usage, location, duration, and any important details."} placeholderTextColor={colors.textMuted} style={[styles.input,styles.textarea,{textAlign:align,writingDirection:direction}]} /></View>
      <Text style={[styles.note,{textAlign:align,writingDirection:direction}]}>{isArabic?"إرسال الطلب لا يعني قبول المشروع أو وجود التزام مالي. نراجع ملخص المشروع أولًا ثم نحدد النطاق والخدمة المناسبة قبل البدء.":"Submitting a request does not create a booking or payment obligation. We review the brief first and confirm scope before work begins."}</Text>
      {error ? <Text style={[styles.error,{textAlign:align,writingDirection:direction}]}>{error}</Text> : null}
      <Pressable disabled={submitting} onPress={()=>void submit()} style={[styles.goldButton,submitting&&styles.disabled]}><Text style={styles.goldButtonText}>{submitting?(isArabic?"جارٍ الإرسال…":"Submitting…"):(isArabic?"إرسال ملخص المشروع إلى كاستينغ ملامح":"Send brief to MLAMH Casting")}</Text></Pressable>
    </View>
  </ScrollView></View>;
}

function Field({label,value,onChangeText,isArabic,keyboardType="default",placeholder}:{label:string;value:string;onChangeText:(v:string)=>void;isArabic:boolean;keyboardType?:"default"|"email-address"|"phone-pad";placeholder?:string}) { return <View style={styles.field}><Text style={[styles.label,{textAlign:isArabic?"right":"left"}]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={keyboardType==="email-address"?"none":"sentences"} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={[styles.input,{textAlign:isArabic?"right":"left",writingDirection:isArabic?"rtl":"ltr"}]} /></View>; }
function MiniField({label,value,onChangeText,isArabic=false}:{label:string;value:string;onChangeText:(v:string)=>void;isArabic?:boolean}) { return <View style={styles.miniField}><Text style={[styles.label,{textAlign:isArabic?"right":"left"}]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholderTextColor={colors.textMuted} style={[styles.input,{textAlign:isArabic?"right":"left",writingDirection:isArabic?"rtl":"ltr"}]} /></View>; }

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{paddingHorizontal:spacing.lg,paddingTop:spacing.xl,paddingBottom:120},rowReverse:{flexDirection:"row-reverse"},hero:{borderWidth:1,borderColor:"rgba(201,169,98,0.18)",borderRadius:30,backgroundColor:"rgba(201,169,98,0.045)",padding:spacing.xl},badgeRow:{flexDirection:"row",alignItems:"center",gap:8},eyebrow:{color:colors.gold,fontSize:10,fontWeight:"800",letterSpacing:1.1},title:{color:colors.textPrimary,fontSize:30,lineHeight:39,fontWeight:"700",marginTop:spacing.lg},description:{color:colors.textMuted,fontSize:13,lineHeight:23,marginTop:spacing.md},steps:{gap:spacing.sm,marginTop:spacing.lg},step:{minHeight:62,flexDirection:"row",alignItems:"center",gap:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.lg,backgroundColor:colors.surface},stepNo:{color:colors.gold,fontSize:11},stepLabel:{flex:1,color:colors.textPrimary,fontSize:14,fontWeight:"600"},formCard:{marginTop:spacing.lg,borderWidth:1,borderColor:colors.border,borderRadius:28,backgroundColor:colors.surface,padding:spacing.lg},formBadge:{flexDirection:"row",alignItems:"center",gap:7},formTitle:{color:colors.textPrimary,fontSize:24,lineHeight:32,fontWeight:"700",marginTop:spacing.md,marginBottom:spacing.md},field:{gap:spacing.sm,marginTop:spacing.lg},miniField:{flex:1,gap:spacing.sm},label:{color:colors.textSecondary,fontSize:11,fontWeight:"600"},input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,backgroundColor:"rgba(0,0,0,0.26)",color:colors.textPrimary,paddingHorizontal:spacing.md,fontSize:13},textarea:{minHeight:150,paddingTop:spacing.md,paddingBottom:spacing.md},choiceRow:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},choice:{minHeight:40,justifyContent:"center",borderWidth:1,borderColor:colors.border,borderRadius:radius.pill,paddingHorizontal:spacing.md},choiceActive:{borderColor:"rgba(201,169,98,0.40)",backgroundColor:"rgba(201,169,98,0.09)"},choiceText:{color:colors.textMuted,fontSize:11},choiceTextActive:{color:colors.gold,fontWeight:"700"},twoCols:{flexDirection:"row",gap:spacing.md,marginTop:spacing.lg},note:{color:colors.textMuted,fontSize:11,lineHeight:19,marginTop:spacing.lg},error:{color:"#E9A8A8",fontSize:11,lineHeight:18,marginTop:spacing.md},goldButton:{minHeight:54,alignItems:"center",justifyContent:"center",borderRadius:radius.lg,backgroundColor:colors.goldSoft,paddingHorizontal:spacing.lg,marginTop:spacing.lg},goldButtonText:{color:"#080808",fontSize:13,fontWeight:"800",textAlign:"center"},disabled:{opacity:.5},successWrap:{margin:spacing.lg,marginTop:spacing.xxxl,borderWidth:1,borderColor:"rgba(201,169,98,0.24)",borderRadius:28,backgroundColor:"rgba(201,169,98,0.05)",padding:spacing.xl},successIcon:{width:56,height:56,borderRadius:18,borderWidth:1,borderColor:"rgba(201,169,98,0.22)",alignItems:"center",justifyContent:"center",marginBottom:spacing.lg},successTitle:{color:colors.textPrimary,fontSize:30,fontWeight:"700",marginTop:spacing.sm},successText:{color:colors.textSecondary,fontSize:13,lineHeight:23,marginTop:spacing.md},requestId:{color:colors.textMuted,fontSize:11,marginTop:spacing.md}});
