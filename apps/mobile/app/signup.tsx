import { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronLeft, ChevronRight, Drama, Sparkles, UserRound } from "lucide-react-native";

import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { clearPendingSignupContext, setPendingSignupContext, supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type SignupIntent = "actor" | "model" | "publisher";
type AccountType = "talent" | "publisher";
type SocialProvider = "google" | "apple";

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  return `+${trimmed.replace(/\D/g, "")}`;
}

function isValidPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export default function SignupScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = useMemo(() => createStyles(), []);
  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<SignupIntent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountType: AccountType = intent === "publisher" ? "publisher" : "talent";
  const talentIntent = intent === "actor" || intent === "model" ? intent : "";
  const textAlign = isRtl ? "right" : "left";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  function goBack() {
    setError(null);
    if (step === 2) { setStep(1); return; }
    router.back();
  }

  function continueFromIntent() {
    if (!intent) {
      setError(isArabic ? "اختر كيف تريد استخدام ملامح للمتابعة." : "Choose how you want to use MLAMH to continue.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function signUpWithSocial(provider: SocialProvider) {
    if (!intent || loading) return;
    setLoading(true); setError(null);
    const termsAcceptedAt = new Date().toISOString();
    try {
      await setPendingSignupContext({ intent, accountType, preferredLocale: locale, termsAcceptedAt });
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: "mlamh://auth/callback", skipBrowserRedirect: true },
      });
      if (oauthError || !data.url) {
        await clearPendingSignupContext().catch(() => undefined);
        const label = provider === "apple" ? "Apple" : "Google";
        setError(isArabic ? `تعذر بدء التسجيل باستخدام ${label}.` : `Unable to start signup with ${label}.`);
        return;
      }
      await Linking.openURL(data.url);
    } catch {
      await clearPendingSignupContext().catch(() => undefined);
      const label = provider === "apple" ? "Apple" : "Google";
      setError(isArabic ? `تعذر التسجيل باستخدام ${label}. حاول مرة أخرى.` : `Unable to sign up with ${label}. Please try again.`);
    } finally { setLoading(false); }
  }

  async function signUpWithEmail() {
    if (!intent || loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedPhone = normalizePhone(phone);

    if (normalizedName.length < 2 || normalizedName.length > 100) return setError(isArabic ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
    if (!isValidPhone(normalizedPhone)) return setError(isArabic ? "أدخل رقم جوال دوليًا صحيحًا، مثل +9665XXXXXXXX." : "Enter a valid international mobile number, for example +9665XXXXXXXX.");
    if (!normalizedEmail) return setError(isArabic ? "أدخل بريدك الإلكتروني." : "Enter your email address.");
    if (password.length < 8) return setError(isArabic ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Your password must contain at least 8 characters.");
    if (password !== passwordConfirmation) return setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
    if (!acceptedTerms) return setError(isArabic ? "وافق على الشروط وسياسة الخصوصية للمتابعة." : "Accept the Terms and Privacy Policy to continue.");

    setLoading(true); setError(null);
    try {
      const acceptedAt = new Date().toISOString();
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: "mlamh://auth/callback",
          data: {
            full_name: normalizedName,
            display_name: accountType === "talent" ? normalizedName : null,
            contact_name: accountType === "publisher" ? normalizedName : null,
            phone: normalizedPhone,
            phone_verified: false,
            account_type: accountType,
            signup_intent: intent,
            talent_intent: talentIntent || null,
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: acceptedAt,
          },
        },
      });

      if (authError || !data.user) {
        const normalized = authError?.message?.toLowerCase() ?? "";
        setError(normalized.includes("already") || normalized.includes("registered")
          ? (isArabic ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول." : "An account already exists with this email. Try signing in.")
          : (isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check the details and try again."));
        return;
      }

      if (data.session) {
        router.replace({ pathname: "/complete-account", params: { accountType, intent } });
        return;
      }

      router.replace({ pathname: "/verify-email", params: { email: normalizedEmail, accountType, talentIntent } });
    } catch {
      setError(isArabic ? "تعذر إنشاء الحساب الآن. تحقق من اتصالك وحاول مرة أخرى." : "Unable to create your account right now. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.topRow, isRtl && styles.rowRtl]}>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={goBack} style={styles.iconButton}><BackIcon size={22} color={darkTheme.text} strokeWidth={1.8} /></Pressable>
            <Image source={isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN} resizeMode="contain" style={styles.brandLogo} />
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "English" : "العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={styles.languageButton}><Text style={styles.languageButtonText}>{isArabic ? "EN" : "العربية"}</Text></Pressable>
          </View>

          <View style={[styles.progressRow, isRtl && styles.rowRtl]}><View style={[styles.progressSegment, styles.progressActive]} /><View style={[styles.progressSegment, step === 2 && styles.progressActive]} /></View>
          <Text style={[styles.stepLabel,{textAlign}]}>{isArabic ? `الخطوة ${step} من 2` : `Step ${step} of 2`}</Text>

          {step === 1 ? <>
            <View style={[styles.header,{alignItems:isRtl?"flex-end":"flex-start"}]}>
              <Text style={[styles.eyebrow,{textAlign}]}>{isArabic ? "ابدأ بما تريد" : "START WITH YOUR GOAL"}</Text>
              <Text accessibilityRole="header" style={[styles.title,{textAlign}]}>{isArabic ? "كيف تريد استخدام ملامح؟" : "What do you want to do on MLAMH?"}</Text>
              <Text style={[styles.subtitle,{textAlign}]}>{isArabic ? "اختر هدفك، وسنجهز لك المسار المناسب بدون مصطلحات أو خطوات مربكة." : "Choose your goal and we'll prepare the right path without confusing setup steps."}</Text>
            </View>
            <View accessibilityRole="radiogroup" style={styles.intentList}>
              <IntentCard active={intent==="actor"} icon="actor" title={isArabic?"أريد فرص تمثيل":"I want acting opportunities"} body={isArabic?"أنشئ ملف ممثل وابدأ التقديم على الفرص المناسبة.":"Create an actor profile and apply to matching opportunities."} onPress={()=>{setIntent("actor");setError(null);}} isRtl={isRtl}/>
              <IntentCard active={intent==="model"} icon="model" title={isArabic?"أريد فرص مودل":"I want modeling opportunities"} body={isArabic?"أنشئ ملف مودل واعرض صورك وبياناتك المهنية.":"Create a model profile and showcase your portfolio."} onPress={()=>{setIntent("model");setError(null);}} isRtl={isRtl}/>
              <IntentCard active={intent==="publisher"} icon="publisher" title={isArabic?"أبحث عن مواهب لمشروع":"I need talent for a project"} body={isArabic?"أرسل احتياجك وسنساعدك في الوصول إلى المواهب المناسبة.":"Tell us what you need and reach the right talent faster."} onPress={()=>{setIntent("publisher");setError(null);}} isRtl={isRtl}/>
            </View>
            {error?<ErrorBox text={error} textAlign={textAlign}/>:null}
            <Pressable accessibilityRole="button" disabled={!intent} onPress={continueFromIntent} style={({pressed})=>[styles.primaryButton,!intent&&styles.disabled,pressed&&styles.pressed]}><Text style={styles.primaryText}>{isArabic?"متابعة":"Continue"}</Text><NextIcon size={19} color="#10100E" strokeWidth={2.2}/></Pressable>
            <Pressable onPress={()=>router.replace("/login")} style={styles.signinButton}><Text style={styles.loginLink}>{isArabic?"لديك حساب؟ تسجيل الدخول":"Already have an account? Sign in"}</Text></Pressable>
          </> : <>
            <View style={[styles.header,{alignItems:isRtl?"flex-end":"flex-start"}]}>
              <Text style={[styles.eyebrow,{textAlign}]}>{isArabic ? "أنشئ حسابك" : "CREATE YOUR ACCOUNT"}</Text>
              <Text accessibilityRole="header" style={[styles.title,{textAlign}]}>{isArabic ? "اختر أسهل طريقة لك" : "Choose the easiest way to continue"}</Text>
              <Text style={[styles.subtitle,{textAlign}]}>{isArabic ? "أيًا كانت طريقة التسجيل، ستكمل نفس الرحلة داخل ملامح." : "Whichever method you choose, you'll continue through the same MLAMH onboarding."}</Text>
            </View>

            <View style={[styles.selectionSummary,isRtl&&styles.rowRtl]}><View style={styles.summaryIcon}>{accountType==="publisher"?<Building2 size={18} color={darkTheme.accent}/>:<UserRound size={18} color={darkTheme.accent}/>}</View><View style={styles.summaryCopy}><Text style={[styles.summaryCaption,{textAlign}]}>{isArabic?"مسارك":"Your path"}</Text><Text style={[styles.summaryTitle,{textAlign}]}>{intent==="actor"?(isArabic?"فرص تمثيل":"Acting opportunities"):intent==="model"?(isArabic?"فرص مودل":"Modeling opportunities"):(isArabic?"البحث عن مواهب":"Find talent")}</Text></View><Pressable onPress={()=>setStep(1)}><Text style={styles.changeText}>{isArabic?"تغيير":"Change"}</Text></Pressable></View>

            <View style={styles.socialCard}>
              <Text style={[styles.socialTitle,{textAlign}]}>{isArabic ? "تسجيل سريع" : "Quick signup"}</Text>
              <Pressable disabled={loading} onPress={()=>void signUpWithSocial("google")} style={({pressed})=>[styles.socialButton,loading&&styles.disabled,pressed&&styles.pressed]}><Text style={styles.socialButtonText}>{isArabic?"المتابعة باستخدام Google":"Continue with Google"}</Text></Pressable>
              <Pressable disabled={loading} onPress={()=>void signUpWithSocial("apple")} style={({pressed})=>[styles.appleButton,loading&&styles.disabled,pressed&&styles.pressed]}><Text style={styles.appleButtonText}>{isArabic?"المتابعة باستخدام Apple":"Continue with Apple"}</Text></Pressable>
              <Text style={[styles.socialConsent,{textAlign}]}>{isArabic?"بالمتابعة باستخدام Google أو Apple فإنك توافق على شروط الاستخدام وسياسة الخصوصية.":"By continuing with Google or Apple, you agree to the Terms of Use and Privacy Policy."}</Text>
              <View style={[styles.legalLinks,isRtl&&styles.rowRtl]}><Pressable onPress={()=>router.push({pathname:"/legal",params:{section:"terms"}})}><Text style={styles.legalLink}>{isArabic?"الشروط":"Terms"}</Text></Pressable><Text style={styles.legalDot}>·</Text><Pressable onPress={()=>router.push({pathname:"/legal",params:{section:"privacy"}})}><Text style={styles.legalLink}>{isArabic?"الخصوصية":"Privacy"}</Text></Pressable></View>
            </View>

            <View style={styles.dividerRow}><View style={styles.dividerLine}/><Text style={styles.dividerText}>{isArabic?"أو بالبريد":"OR EMAIL"}</Text><View style={styles.dividerLine}/></View>

            <View style={styles.formCard}>
              <Field required label={accountType==="talent"?(isArabic?"الاسم المهني":"Professional name"):(isArabic?"اسم مسؤول الحساب":"Contact name")} value={name} onChangeText={setName} placeholder={isArabic?"الاسم الكامل":"Full name"} autoComplete="name" autoCapitalize="words" align={textAlign} direction={isRtl?"rtl":"ltr"}/>
              <Field required label={isArabic?"رقم الجوال":"Mobile number"} value={phone} onChangeText={setPhone} placeholder="+9665XXXXXXXX" autoComplete="tel" keyboardType="phone-pad" align={textAlign} direction="ltr"/>
              <Field required label={isArabic?"البريد الإلكتروني":"Email"} value={email} onChangeText={setEmail} placeholder="name@example.com" autoComplete="email" autoCapitalize="none" keyboardType="email-address" align={textAlign} direction="ltr"/>
              <Field required label={isArabic?"كلمة المرور":"Password"} value={password} onChangeText={setPassword} placeholder={isArabic?"8 أحرف على الأقل":"At least 8 characters"} autoComplete="new-password" secureTextEntry align={textAlign} direction={isRtl?"rtl":"ltr"}/>
              <Field required label={isArabic?"تأكيد كلمة المرور":"Confirm password"} value={passwordConfirmation} onChangeText={setPasswordConfirmation} placeholder="••••••••" autoComplete="new-password" secureTextEntry align={textAlign} direction={isRtl?"rtl":"ltr"}/>
              <Text style={[styles.requiredLegend,{textAlign}]}>{isArabic?"* حقل مطلوب":"* Required field"}</Text>
              <Pressable accessibilityRole="checkbox" accessibilityState={{checked:acceptedTerms}} onPress={()=>setAcceptedTerms((v)=>!v)} style={[styles.termsRow,isRtl&&styles.rowRtl]}><View style={[styles.checkbox,acceptedTerms&&styles.checkboxActive]}>{acceptedTerms?<Check size={14} color="#10100E" strokeWidth={3}/>:null}</View><Text style={[styles.termsText,{textAlign}]}>{isArabic?"أوافق على الشروط وسياسة الخصوصية":"I agree to the Terms and Privacy Policy"}</Text></Pressable>
              {error?<ErrorBox text={error} textAlign={textAlign}/>:null}
              <Pressable disabled={loading} onPress={()=>void signUpWithEmail()} style={({pressed})=>[styles.primaryButton,loading&&styles.disabled,pressed&&styles.pressed]}><Text style={styles.primaryText}>{loading?(isArabic?"جارٍ إنشاء الحساب…":"Creating account…"):(isArabic?"إنشاء الحساب":"Create account")}</Text><NextIcon size={19} color="#10100E"/></Pressable>
              <View style={[styles.otpNote,isRtl&&styles.rowRtl]}><Sparkles size={17} color={darkTheme.accent}/><Text style={[styles.otpNoteText,{textAlign}]}>{isArabic?"بعد الإنشاء سنرسل رمز تحقق من 6 أرقام إلى بريدك، وتكمل مباشرة داخل التطبيق.":"Next, we'll email you a 6-digit verification code and you'll continue inside the app."}</Text></View>
            </View>
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function IntentCard({active,icon,title,body,onPress,isRtl}:{active:boolean;icon:"actor"|"model"|"publisher";title:string;body:string;onPress:()=>void;isRtl:boolean}){
  const Icon=icon==="publisher"?Building2:icon==="actor"?Drama:UserRound;
  return <Pressable accessibilityRole="radio" accessibilityState={{selected:active}} onPress={onPress} style={({pressed})=>[stylesStatic.intentCard,active&&stylesStatic.intentCardActive,pressed&&stylesStatic.pressed]}><View style={[stylesStatic.intentInner,isRtl&&stylesStatic.rowRtl]}><View style={[stylesStatic.intentIcon,active&&stylesStatic.intentIconActive]}><Icon size={23} color={active?darkTheme.accent:"#E7E5DD"}/></View><View style={stylesStatic.intentCopy}><Text style={[stylesStatic.intentTitle,{textAlign:isRtl?"right":"left"}]}>{title}</Text><Text style={[stylesStatic.intentBody,{textAlign:isRtl?"right":"left"}]}>{body}</Text></View><View style={[stylesStatic.radio,active&&stylesStatic.radioActive]}>{active?<View style={stylesStatic.radioDot}/>:null}</View></View></Pressable>;
}

function Field({label,required,align,direction,...props}:{label:string;required?:boolean;align:"left"|"right";direction:"ltr"|"rtl"}&React.ComponentProps<typeof TextInput>){return <View style={stylesStatic.fieldWrap}><Text style={[stylesStatic.fieldLabel,{textAlign:align}]}>{label}{required?<Text style={stylesStatic.required}> *</Text>:null}</Text><TextInput placeholderTextColor="#85857E" style={[stylesStatic.input,{textAlign:align,writingDirection:direction}]} {...props}/></View>}
function ErrorBox({text,textAlign}:{text:string;textAlign:"left"|"right"}){return <View style={stylesStatic.errorBox}><Text accessibilityRole="alert" style={[stylesStatic.errorText,{textAlign}]}>{text}</Text></View>}

const stylesStatic=StyleSheet.create({rowRtl:{flexDirection:"row-reverse"},pressed:{opacity:.82},intentCard:{borderRadius:20,borderWidth:1,borderColor:"#2A2A26",backgroundColor:"#151513",overflow:"hidden"},intentCardActive:{borderColor:"#796635",backgroundColor:"#1B1913"},intentInner:{minHeight:104,padding:16,flexDirection:"row",alignItems:"center",gap:13},intentIcon:{width:46,height:46,borderRadius:15,backgroundColor:"#20201D",alignItems:"center",justifyContent:"center"},intentIconActive:{backgroundColor:"#292316"},intentCopy:{flex:1,gap:5},intentTitle:{color:darkTheme.text,fontSize:16,lineHeight:21,fontWeight:"800"},intentBody:{color:"#9C9B94",fontSize:12,lineHeight:18},radio:{width:22,height:22,borderRadius:11,borderWidth:1.5,borderColor:"#66665F",alignItems:"center",justifyContent:"center"},radioActive:{borderColor:darkTheme.accent},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:darkTheme.accent},fieldWrap:{gap:7},fieldLabel:{color:darkTheme.text,fontSize:13,fontWeight:"700",width:"100%"},required:{color:darkTheme.accent},input:{minHeight:50,borderRadius:14,borderWidth:1,borderColor:"#32322E",backgroundColor:"#0D0D0C",color:darkTheme.text,paddingHorizontal:14,fontSize:14},errorBox:{borderRadius:14,padding:12,backgroundColor:"#281718",borderWidth:1,borderColor:"#5A2C30",marginTop:4},errorText:{color:"#F2B8B5",fontSize:13,lineHeight:20}});

function createStyles(){return StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},scrollContent:{flexGrow:1,paddingBottom:28},content:{width:"100%",maxWidth:620,alignSelf:"center",paddingHorizontal:20},topRow:{minHeight:62,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},rowRtl:{flexDirection:"row-reverse"},iconButton:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#2B2B28",alignItems:"center",justifyContent:"center"},brandLogo:{width:116,height:38},languageButton:{minWidth:44,height:36,paddingHorizontal:9,borderRadius:18,borderWidth:1,borderColor:"#2B2B28",alignItems:"center",justifyContent:"center"},languageButtonText:{color:darkTheme.text,fontSize:12,fontWeight:"800"},progressRow:{flexDirection:"row",gap:7,marginTop:10},progressSegment:{height:3,flex:1,borderRadius:2,backgroundColor:"#2A2A26"},progressActive:{backgroundColor:darkTheme.accent},stepLabel:{color:"#8F8F88",fontSize:11,marginTop:8,width:"100%"},header:{paddingTop:26,paddingBottom:22},eyebrow:{color:darkTheme.accent,fontSize:11,letterSpacing:1.25,fontWeight:"800",width:"100%",marginBottom:8},title:{color:darkTheme.text,fontSize:30,lineHeight:38,fontWeight:"800",width:"100%"},subtitle:{color:"#AAA9A1",fontSize:14,lineHeight:22,marginTop:10,width:"100%"},intentList:{gap:12},primaryButton:{minHeight:54,borderRadius:16,backgroundColor:darkTheme.accent,flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center",marginTop:18},primaryText:{color:"#10100E",fontSize:15,fontWeight:"800"},disabled:{opacity:.4},pressed:{opacity:.82},signinButton:{minHeight:48,alignItems:"center",justifyContent:"center",marginTop:10},loginLink:{color:"#D8D6CD",fontSize:13,fontWeight:"700"},selectionSummary:{minHeight:70,borderRadius:18,borderWidth:1,borderColor:"#3F3929",backgroundColor:"#17150F",flexDirection:"row",alignItems:"center",gap:11,padding:13,marginBottom:14},summaryIcon:{width:38,height:38,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#292316"},summaryCopy:{flex:1},summaryCaption:{color:"#8F8F88",fontSize:10},summaryTitle:{color:darkTheme.text,fontSize:14,fontWeight:"800",marginTop:2},changeText:{color:darkTheme.accent,fontSize:12,fontWeight:"800"},socialCard:{backgroundColor:"#151513",borderWidth:1,borderColor:"#292925",borderRadius:24,padding:18,gap:10},socialTitle:{color:darkTheme.text,fontSize:13,fontWeight:"800",width:"100%"},socialButton:{minHeight:52,borderRadius:14,borderWidth:1,borderColor:"#32322E",backgroundColor:"#F4F4F0",alignItems:"center",justifyContent:"center"},socialButtonText:{color:"#11110F",fontSize:14,fontWeight:"800"},appleButton:{minHeight:52,borderRadius:14,borderWidth:1,borderColor:"#40403B",backgroundColor:"#050505",alignItems:"center",justifyContent:"center"},appleButtonText:{color:"#FFFFFF",fontSize:14,fontWeight:"800"},socialConsent:{color:"#8F8F88",fontSize:10,lineHeight:16,width:"100%",marginTop:3},legalLinks:{flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center"},legalLink:{color:darkTheme.accent,fontSize:11,fontWeight:"700"},legalDot:{color:"#696963"},dividerRow:{flexDirection:"row",alignItems:"center",gap:10,marginVertical:14},dividerLine:{height:1,flex:1,backgroundColor:"#2B2B28"},dividerText:{color:"#777770",fontSize:10,fontWeight:"800"},formCard:{backgroundColor:"#151513",borderWidth:1,borderColor:"#292925",borderRadius:24,padding:18,gap:14},requiredLegend:{color:"#8D8D86",fontSize:11,marginTop:-4,width:"100%"},termsRow:{flexDirection:"row",alignItems:"center",gap:10,marginTop:2},checkbox:{width:21,height:21,borderRadius:6,borderWidth:1,borderColor:"#56564F",alignItems:"center",justifyContent:"center"},checkboxActive:{backgroundColor:darkTheme.accent,borderColor:darkTheme.accent},termsText:{color:"#C8C7C0",fontSize:12,lineHeight:18,flex:1},otpNote:{flexDirection:"row",gap:9,alignItems:"flex-start",backgroundColor:"#11110F",borderRadius:14,padding:12},otpNoteText:{color:"#9D9C94",flex:1,fontSize:11,lineHeight:18}})}
