import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronLeft, ChevronRight, FileText, RotateCcw, ShieldCheck } from "lucide-react-native";

import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";

type DocumentKey = "privacy" | "terms" | "refund";
type LegalSection = { arTitle: string; enTitle: string; ar: string[]; en: string[] };

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");
const DOCUMENT_KEYS: DocumentKey[] = ["privacy", "terms", "refund"];

const DOCUMENTS: Record<DocumentKey, { arTitle: string; enTitle: string; icon: typeof ShieldCheck; sections: LegalSection[] }> = {
  privacy: {
    arTitle: "سياسة الخصوصية", enTitle: "Privacy policy", icon: ShieldCheck,
    sections: [
      { arTitle:"مقدمة", enTitle:"Introduction", ar:["تحترم منصة ملامح خصوصية المستخدمين، وتلتزم بالتعامل مع المعلومات الشخصية بمسؤولية وشفافية.","توضح هذه السياسة أنواع المعلومات التي قد نجمعها وكيفية استخدامها وحمايتها والخيارات المتاحة للمستخدم بشأن بياناته."], en:["MLAMH respects user privacy and is committed to handling personal information responsibly and transparently.","This policy explains the information we may collect, how it is used and protected, and the choices available to users."] },
      { arTitle:"المعلومات التي نجمعها", enTitle:"Information we collect", ar:["قد نجمع المعلومات التي يقدمها المستخدم عند إنشاء الحساب أو تحديث الملف الشخصي أو نشر فرصة أو التقديم عليها، بما يشمل بيانات التواصل والمعلومات المهنية والصور ونماذج الأعمال.","قد نجمع أيضًا معلومات تقنية أساسية وسجلات استخدام المنصة عند توفرها."], en:["We may collect information provided when creating or updating an account, publishing an opportunity, or applying, including contact, professional, image, and portfolio information.","We may also collect basic technical and platform usage information when available."] },
      { arTitle:"استخدام ومشاركة المعلومات", enTitle:"Use and sharing", ar:["نستخدم المعلومات لتشغيل المنصة وإدارة الحسابات والملفات والفرص والطلبات والإشعارات والدعم والأمان.","لا نبيع المعلومات الشخصية للمستخدمين. وقد تتم مشاركة المعلومات بالقدر اللازم لتقديم وظائف المنصة أو عند وجود متطلب نظامي صالح."], en:["We use information to operate the platform, manage accounts, profiles, opportunities, applications, notifications, support, and security.","We do not sell users’ personal information. Information may be shared where necessary to provide platform functions or comply with valid legal requirements."] },
      { arTitle:"حقوق المستخدم وحماية البيانات", enTitle:"User rights & data protection", ar:["نتخذ إجراءات تقنية وتنظيمية معقولة للمساعدة في حماية المعلومات.","يمكن للمستخدم طلب تصحيح معلوماته أو حذف حسابه وبياناته مع مراعاة الالتزامات النظامية، وقد نطلب التحقق من الهوية قبل تنفيذ الطلب."], en:["We take reasonable technical and organizational measures to help protect information.","Users may request correction or deletion of their account and data, subject to legal obligations, and identity verification may be required."] },
    ],
  },
  terms: {
    arTitle: "الشروط والأحكام", enTitle: "Terms & conditions", icon: FileText,
    sections: [
      { arTitle:"استخدام المنصة", enTitle:"Using MLAMH", ar:["تنظم هذه الشروط استخدام منصة ملامح والخدمات والخصائص المتاحة من خلالها، ويعد استخدام المنصة موافقة على الالتزام بها.","يجب استخدام المنصة لأغراض مشروعة ومهنية، ولا يجوز انتحال الهوية أو نشر محتوى مضلل أو محاولة اختراق أو تعطيل المنصة."], en:["These terms govern use of MLAMH and its services. Using the platform constitutes agreement to these terms.","The platform must be used for lawful and professional purposes. Impersonation, misleading content, unauthorized access, or disruption are prohibited."] },
      { arTitle:"الحسابات والملفات", enTitle:"Accounts & profiles", ar:["يلتزم المستخدم بتقديم معلومات صحيحة ومحدثة ويتحمل مسؤولية حماية بيانات تسجيل الدخول.","تتحمل الموهبة مسؤولية صحة معلومات ملفها والحقوق اللازمة للصور ونماذج الأعمال التي تضيفها."], en:["Users must provide accurate, current information and are responsible for protecting their login credentials.","Talent users are responsible for profile accuracy and for holding the rights needed for uploaded images and portfolio materials."] },
      { arTitle:"الفرص وطلبات التقديم", enTitle:"Opportunities & applications", ar:["تتحمل الجهة الناشرة مسؤولية صحة تفاصيل الفرصة ومتطلباتها ومواعيدها ومعلوماتها المالية أو التعاقدية.","لا تضمن ملامح قبول أي طلب أو حصول أي مستخدم على فرصة أو عقد أو مقابل مالي، ويتحمل المستخدمون مسؤولية التواصل والتفاوض والاتفاق بينهم."], en:["Publishers are responsible for the accuracy of opportunity details, requirements, deadlines, and financial or contractual information.","MLAMH does not guarantee acceptance, work, contracts, or payment. Users are responsible for communication, negotiation, and agreements between them."] },
      { arTitle:"دور ملامح", enTitle:"MLAMH's role", ar:["تعمل ملامح كمنصة تقنية لتسهيل الوصول والتواصل بين المواهب والجهات الناشرة، ولا تعد طرفًا في العقود بين المستخدمين ما لم ينص على خلاف ذلك صراحة.","يحق لملامح مراجعة أو تعليق أو إزالة الحسابات أو المحتوى أو الفرص المخالفة للشروط أو الأنظمة المنطبقة."], en:["MLAMH operates as a technology platform facilitating discovery and communication and is not a party to user contracts unless expressly stated otherwise.","MLAMH may review, suspend, or remove accounts, content, or opportunities that violate these terms or applicable requirements."] },
    ],
  },
  refund: {
    arTitle: "سياسة الاسترداد", enTitle: "Refund policy", icon: RotateCcw,
    sections: [
      { arTitle:"نطاق السياسة", enTitle:"Scope", ar:["تطبق سياسة الاسترداد على الخدمات أو المنتجات المدفوعة التي توفرها ملامح عندما تكون خاصية الدفع مفعلة ومتاحًا الاسترداد وفق شروط الخدمة المحددة."], en:["The refund policy applies to paid MLAMH services or products when payments are enabled and a refund is available under the relevant service terms."] },
      { arTitle:"الخدمات الرقمية", enTitle:"Digital services", ar:["قد يبدأ تنفيذ بعض الخدمات الرقمية فور الدفع أو التفعيل. وقد لا تكون المبالغ قابلة للاسترداد بعد بدء تنفيذ الخدمة أو استهلاك الميزة، إلا إذا تطلب النظام أو وصف الخدمة خلاف ذلك."], en:["Some digital services may begin immediately after payment or activation. Amounts may become non-refundable once service delivery or feature consumption begins, unless law or the service description requires otherwise."] },
      { arTitle:"المبالغ المكررة أو الأخطاء", enTitle:"Duplicate charges or errors", ar:["إذا نتج خصم مكرر أو خطأ تقني مثبت في الدفع، يمكن للمستخدم فتح تذكرة دعم مع بيانات العملية ليتم التحقق منها ومعالجتها وفق الحالة."], en:["If a duplicate charge or verified payment error occurs, the user can open a support ticket with transaction details for review and resolution."] },
      { arTitle:"طلب الاسترداد", enTitle:"Requesting a refund", ar:["يتم تقديم طلبات الاسترداد من خلال مركز الدعم داخل ملامح مع ذكر سبب الطلب وأي معلومات مرتبطة بعملية الدفع. تتم مراجعة الطلب وفق الخدمة والحالة والمتطلبات النظامية المنطبقة."], en:["Refund requests are submitted through the MLAMH support center with the reason and relevant payment information. Requests are reviewed according to the service, circumstances, and applicable requirements."] },
    ],
  },
};

export default function LegalScreen() {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const requested = Array.isArray(params.section) ? params.section[0] : params.section;
  const initialSection: DocumentKey = DOCUMENT_KEYS.includes(requested as DocumentKey) ? requested as DocumentKey : "privacy";
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isArabic;
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = useMemo(() => createStyles(darkTheme), []);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const [open, setOpen] = useState<DocumentKey | null>(initialSection);
  const brandSource = isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN;

  useEffect(() => {
    if (DOCUMENT_KEYS.includes(requested as DocumentKey)) setOpen(requested as DocumentKey);
  }, [requested]);

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}><ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[styles.top, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={21} color={darkTheme.text}/></Pressable><Image source={brandSource} resizeMode="contain" style={styles.brandLogo}/></View>
    <View style={[styles.hero, isRtl && styles.rowRtl]}><View style={styles.heroIcon}><ShieldCheck size={22} color={darkTheme.accent}/></View><View style={styles.heroCopy}><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isRtl && styles.textRtl]}>{isArabic ? "القانوني والسياسات" : "Legal & policies"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "الخصوصية والشروط والاسترداد داخل التطبيق، في مكان واحد مستقل عن مركز الدعم." : "Privacy, terms and refunds inside the app, in one place separate from support."}</Text></View></View>

    {DOCUMENT_KEYS.map((key) => { const doc = DOCUMENTS[key]; const Icon = doc.icon; const expanded = open === key; return <View key={key} style={[styles.document, expanded && styles.documentOpen]}><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? null : key)} style={[styles.documentHeader, isRtl && styles.rowRtl]}><View style={styles.documentIcon}><Icon size={20} color={darkTheme.accent}/></View><Text style={[styles.documentTitle, isRtl && styles.textRtl]}>{isArabic ? doc.arTitle : doc.enTitle}</Text><ChevronDown size={19} color={darkTheme.muted} style={expanded ? styles.chevronOpen : undefined}/></Pressable>{expanded ? <View style={styles.documentBody}>{doc.sections.map((section, index) => <View key={`${key}-${index}`} style={styles.section}><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{isArabic ? section.arTitle : section.enTitle}</Text>{(isArabic ? section.ar : section.en).map((paragraph, pIndex) => <Text key={pIndex} style={[styles.paragraph, isRtl && styles.textRtl]}>{paragraph}</Text>)}</View>)}</View> : null}</View>; })}

    <Pressable onPress={() => router.push("/support")} style={[styles.supportCard, isRtl && styles.rowRtl]}><ShieldCheck size={18} color={darkTheme.accent}/><Text style={[styles.supportText, isRtl && styles.textRtl]}>{isArabic ? "لديك استفسار قانوني أو طلب استرداد؟ افتح تذكرة دعم من داخل التطبيق." : "Have a legal question or refund request? Open a support ticket inside the app."}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:680,alignSelf:"center",paddingHorizontal:20,paddingTop:8,paddingBottom:38,gap:15},contentCompact:{paddingHorizontal:14,gap:12},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:54},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},backButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},brandLogo:{width:124,height:48},hero:{flexDirection:"row",alignItems:"flex-start",gap:12,borderWidth:1,borderColor:"#C9A96233",borderRadius:22,backgroundColor:"#C9A96208",padding:16},heroIcon:{width:46,height:46,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center"},heroCopy:{flex:1,gap:4},title:{color:theme.text,fontSize:27,lineHeight:33,fontWeight:"900"},titleCompact:{fontSize:24,lineHeight:30},subtitle:{color:theme.muted,fontSize:12,lineHeight:19},document:{borderWidth:1,borderColor:theme.border,borderRadius:18,backgroundColor:theme.surface,overflow:"hidden"},documentOpen:{borderColor:"#C9A96255"},documentHeader:{minHeight:62,flexDirection:"row",alignItems:"center",gap:11,paddingHorizontal:14},documentIcon:{width:38,height:38,borderRadius:12,borderWidth:1,borderColor:"#C9A96233",backgroundColor:"#C9A9620A",alignItems:"center",justifyContent:"center"},documentTitle:{flex:1,color:theme.text,fontSize:15,fontWeight:"900"},chevronOpen:{transform:[{rotate:"180deg"}]},documentBody:{borderTopWidth:1,borderTopColor:theme.border,padding:15,gap:16},section:{gap:7},sectionTitle:{color:theme.accent,fontSize:13,fontWeight:"900"},paragraph:{color:theme.muted,fontSize:12,lineHeight:20},supportCard:{flexDirection:"row",alignItems:"flex-start",gap:10,borderWidth:1,borderColor:"#C9A96233",borderRadius:16,backgroundColor:"#C9A96208",padding:14},supportText:{flex:1,color:theme.text,fontSize:11,lineHeight:18,fontWeight:"700"}}); }
