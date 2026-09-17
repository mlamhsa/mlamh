import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { completeMobilePublisherOnboarding, finalizeMobileAccount } from "@/src/domains/account/api";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, PROFILE_VISIBILITY_OPTIONS, PUBLISHER_TYPE_OPTIONS, SAUDI_SIGNUP_CITIES, TALENT_TYPE_OPTIONS } from "@/src/domains/auth/signup-data";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

type AccountType = "talent" | "publisher";
type Option = { value: string; ar: string; en: string };

function normalizeSaudiPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export default function SetupAccountScreen() {
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const accountType: AccountType = rawType === "publisher" ? "publisher" : "talent";
  const isTalent = accountType === "talent";
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const writingDirection = isArabic ? "rtl" : "ltr";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [talentType, setTalentType] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [publisherType, setPublisherType] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata ?? {};
      const suggested = String(metadata.full_name ?? metadata.name ?? metadata.display_name ?? "").trim();
      if (suggested) setFullName(suggested);
    });
  }, []);

  async function submit() {
    if (submitting) return;
    setErrorMessage("");
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const phoneDigits = normalizeSaudiPhone(phone);
    const normalizedPhone = `+966${phoneDigits}`;

    if (cleanName.length < 2 || cleanName.length > 100) return setErrorMessage(isArabic ? "أدخل اسمًا صحيحًا." : "Enter a valid name.");
    if (!/^5\d{8}$/.test(phoneDigits)) return setErrorMessage(isArabic ? "أدخل رقم جوال سعودي صحيحًا." : "Enter a valid Saudi mobile number.");
    if (isTalent && (!talentType || !nationality || !gender || !city)) return setErrorMessage(isArabic ? "أكمل نوع الموهبة والجنسية والجنس والمدينة." : "Complete talent type, nationality, gender, and city.");
    if (!isTalent && !publisherType) return setErrorMessage(isArabic ? "حدد صفة الناشر." : "Choose the publisher type.");
    if (!acceptedTerms) return setErrorMessage(isArabic ? "يجب الموافقة على الشروط وسياسة الخصوصية." : "Accept the Terms and Privacy Policy.");
    if (isTalent && !acceptedAccuracy) return setErrorMessage(isArabic ? "أكد دقة البيانات والموافقة على التواصل." : "Confirm data accuracy and contact consent.");

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const metadata = {
        full_name: cleanName,
        display_name: isTalent ? cleanName : null,
        contact_name: isTalent ? null : cleanName,
        phone: normalizedPhone,
        phone_country_iso: "SA",
        phone_country_code: "+966",
        phone_verified: false,
        account_type: accountType,
        signup_intent: isTalent ? talentType : "publisher",
        publisher_mode: !isTalent ? (publisherType === "individual" ? "individual" : "organization") : null,
        publisher_type: !isTalent ? publisherType : null,
        talent_type: isTalent ? talentType : null,
        nationality_slug: isTalent ? nationality : null,
        gender: isTalent ? gender : null,
        residence_country_code: isTalent ? "SA" : null,
        city_slug: isTalent ? city : null,
        profile_visibility: isTalent ? profileVisibility : null,
        preferred_locale: locale,
        terms_accepted: true,
        terms_accepted_at: now,
        data_accuracy_contact_consent: isTalent ? true : null,
        data_accuracy_contact_consent_at: isTalent ? now : null,
      };
      const { error: metadataError } = await supabase.auth.updateUser({ data: metadata });
      if (metadataError) throw metadataError;

      await finalizeMobileAccount({ displayName: cleanName, phone: normalizedPhone, accountType });
      if (!isTalent) {
        await completeMobilePublisherOnboarding({
          publisherMode: publisherType === "individual" ? "individual" : "organization",
          publisherType,
        });
      }
      await session.refresh();
      router.replace("/" as never);
    } catch {
      setErrorMessage(isArabic ? "تعذر إكمال الحساب الآن. تحقق من اتصالك وحاول مرة أخرى." : "Unable to complete your account. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "خطوة أخيرة" : "ONE LAST STEP"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection }]}>{isTalent ? (isArabic ? "جهّز حساب الموهبة" : "Finish your talent account") : (isArabic ? "أكمل بيانات حسابك" : "Complete your account")}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection }]}>{isArabic ? "لن نكرر البيانات الموجودة لدينا. أكمل الحقول الضرورية مرة واحدة ثم تدخل مباشرة إلى حسابك." : "Complete the required fields once, then continue directly to your account."}</Text>

        <View style={styles.card}>
          <Field label={isTalent ? (isArabic ? "الاسم الكامل" : "Full name") : (isArabic ? "اسم المسؤول" : "Contact name")} isArabic={isArabic}>
            <TextInput value={fullName} onChangeText={setFullName} autoComplete="name" placeholder={isArabic ? "اكتب الاسم" : "Enter name"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection }]} />
          </Field>
          <Field label={isArabic ? "رقم الجوال" : "Mobile number"} isArabic={isArabic}>
            <View style={[styles.phoneShell, isArabic && styles.rowReverse]}><View style={styles.dialCode}><Text style={styles.dialCodeText}>+966</Text></View><TextInput value={phone} onChangeText={(value) => setPhone(normalizeSaudiPhone(value))} keyboardType="phone-pad" placeholder="5XXXXXXXX" placeholderTextColor={colors.textMuted} maxLength={9} style={styles.phoneInput} /></View>
          </Field>

          {isTalent ? <>
            <Field label={isArabic ? "نوع الموهبة" : "Talent type"} isArabic={isArabic}><ChoiceRow options={TALENT_TYPE_OPTIONS} value={talentType} onChange={setTalentType} isArabic={isArabic} /></Field>
            <Field label={isArabic ? "الجنسية" : "Nationality"} isArabic={isArabic}><OptionPicker title={isArabic ? "اختر الجنسية" : "Choose nationality"} options={NATIONALITY_OPTIONS} value={nationality} onChange={setNationality} isArabic={isArabic} searchable /></Field>
            <Field label={isArabic ? "الجنس" : "Gender"} isArabic={isArabic}><ChoiceRow options={GENDER_OPTIONS} value={gender} onChange={setGender} isArabic={isArabic} wrap /></Field>
            <Field label={isArabic ? "مدينة الإقامة" : "City of residence"} isArabic={isArabic}><OptionPicker title={isArabic ? "اختر المدينة" : "Choose city"} options={SAUDI_SIGNUP_CITIES} value={city} onChange={setCity} isArabic={isArabic} searchable /></Field>
            <Field label={isArabic ? "خصوصية الملف" : "Profile visibility"} isArabic={isArabic}><ChoiceRow options={PROFILE_VISIBILITY_OPTIONS} value={profileVisibility} onChange={(value) => setProfileVisibility(value as "public" | "private")} isArabic={isArabic} wrap /></Field>
          </> : <Field label={isArabic ? "صفة الناشر" : "Publisher type"} isArabic={isArabic}><ChoiceRow options={PUBLISHER_TYPE_OPTIONS} value={publisherType} onChange={setPublisherType} isArabic={isArabic} wrap /></Field>}

          <ConsentRow checked={acceptedTerms} onPress={() => setAcceptedTerms((value) => !value)} text={isArabic ? "أوافق على الشروط وسياسة الخصوصية." : "I agree to the Terms and Privacy Policy."} isArabic={isArabic} />
          {isTalent ? <ConsentRow checked={acceptedAccuracy} onPress={() => setAcceptedAccuracy((value) => !value)} text={isArabic ? "أؤكد دقة البيانات وأوافق على التواصل المتعلق بالحساب والفرص." : "I confirm my data is accurate and consent to account/opportunity contact."} isArabic={isArabic} /> : null}
          {errorMessage ? <Text style={[styles.error, { textAlign: align, writingDirection }]}>{errorMessage}</Text> : null}
          <Pressable disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, submitting && styles.disabled, pressed && styles.pressed]}><Text style={styles.submitText}>{submitting ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ ومتابعة" : "Save & continue")}</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, isArabic, children }: { label: string; isArabic: boolean; children: React.ReactNode }) { return <View style={styles.field}><Text style={[styles.label, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{label}<Text style={styles.required}> *</Text></Text>{children}</View>; }
function ChoiceRow({ options, value, onChange, isArabic, wrap = false }: { options: readonly Option[]; value: string; onChange: (value: string) => void; isArabic: boolean; wrap?: boolean }) { return <View style={[styles.choices, wrap && styles.wrap, isArabic && styles.rowReverse]}>{options.map((option) => { const active = option.value === value; return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{isArabic ? option.ar : option.en}</Text></Pressable>; })}</View>; }
function ConsentRow({ checked, onPress, text, isArabic }: { checked: boolean; onPress: () => void; text: string; isArabic: boolean }) { return <Pressable onPress={onPress} style={[styles.consentRow, isArabic && styles.rowReverse]}><View style={[styles.checkbox, checked && styles.checkboxActive]}>{checked ? <Check size={14} color="#080808" /> : null}</View><Text style={[styles.consentText, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{text}</Text></Pressable>; }
function OptionPicker({ title, options, value, onChange, isArabic, searchable = false }: { title: string; options: readonly Option[]; value: string; onChange: (value: string) => void; isArabic: boolean; searchable?: boolean }) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return options; return options.filter((option) => `${option.ar} ${option.en}`.toLowerCase().includes(q)); }, [options, query]);
  return <><Pressable onPress={() => setOpen(true)} style={[styles.picker, isArabic && styles.rowReverse]}><Text style={[styles.pickerText, !selected && styles.placeholder]}>{selected ? (isArabic ? selected.ar : selected.en) : title}</Text><ChevronDown size={17} color={colors.textMuted} /></Pressable><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={[styles.modalHeader, isArabic && styles.rowReverse]}><Text style={styles.modalTitle}>{title}</Text><Pressable onPress={() => setOpen(false)}><X size={22} color={colors.textPrimary} /></Pressable></View>{searchable ? <View style={[styles.searchBox, isArabic && styles.rowReverse]}><Search size={16} color={colors.textMuted} /><TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "بحث..." : "Search..."} placeholderTextColor={colors.textMuted} style={[styles.searchInput, { textAlign: isArabic ? "right" : "left" }]} /></View> : null}<FlatList data={filtered} keyExtractor={(item) => item.value} renderItem={({ item }) => <Pressable onPress={() => { onChange(item.value); setOpen(false); setQuery(""); }} style={[styles.optionRow, isArabic && styles.rowReverse]}><Text style={styles.optionText}>{isArabic ? item.ar : item.en}</Text>{item.value === value ? <Check size={17} color={colors.gold} /> : null}</Pressable>} /></View></View></Modal></>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},content:{paddingHorizontal:spacing.xl,paddingTop:spacing.xxl,paddingBottom:72},eyebrow:{color:colors.gold,fontSize:11,fontWeight:"800",letterSpacing:2},title:{color:colors.textPrimary,fontSize:31,lineHeight:39,fontWeight:"700",marginTop:spacing.sm},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:22,marginTop:spacing.md},card:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:28,padding:spacing.lg,marginTop:spacing.xxl},field:{marginBottom:spacing.lg},label:{color:colors.textSecondary,fontSize:12,fontWeight:"700",marginBottom:spacing.sm},required:{color:colors.gold},input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,color:colors.textPrimary,paddingHorizontal:spacing.md,fontSize:14},phoneShell:{flexDirection:"row",gap:spacing.sm},rowReverse:{flexDirection:"row-reverse"},dialCode:{minWidth:90,minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,alignItems:"center",justifyContent:"center"},dialCodeText:{color:colors.textSecondary,fontSize:14},phoneInput:{flex:1,minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,color:colors.textPrimary,paddingHorizontal:spacing.md,fontSize:14,textAlign:"left",writingDirection:"ltr"},choices:{flexDirection:"row",gap:spacing.sm},wrap:{flexWrap:"wrap"},choice:{minHeight:42,borderWidth:1,borderColor:colors.border,borderRadius:radius.pill,paddingHorizontal:spacing.lg,alignItems:"center",justifyContent:"center"},choiceActive:{borderColor:colors.gold,backgroundColor:"rgba(201,169,98,0.10)"},choiceText:{color:colors.textMuted,fontSize:11},choiceTextActive:{color:colors.gold,fontWeight:"700"},picker:{minHeight:52,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md},pickerText:{color:colors.textPrimary,fontSize:13},placeholder:{color:colors.textMuted},consentRow:{flexDirection:"row",alignItems:"flex-start",gap:spacing.md,paddingVertical:spacing.sm},checkbox:{width:22,height:22,borderWidth:1,borderColor:colors.border,borderRadius:6,alignItems:"center",justifyContent:"center"},checkboxActive:{backgroundColor:colors.gold,borderColor:colors.gold},consentText:{flex:1,color:colors.textSecondary,fontSize:12,lineHeight:20},error:{color:"#E9A8A8",fontSize:12,lineHeight:20,marginTop:spacing.md},submit:{minHeight:54,borderRadius:radius.lg,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center",marginTop:spacing.lg},submitText:{color:"#090909",fontSize:14,fontWeight:"900"},disabled:{opacity:.45},pressed:{opacity:.84},modalBackdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,.65)"},modalCard:{maxHeight:"75%",backgroundColor:"#111",borderTopLeftRadius:28,borderTopRightRadius:28,padding:spacing.lg},modalHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:spacing.md},modalTitle:{color:colors.textPrimary,fontSize:18,fontWeight:"800"},searchBox:{minHeight:46,flexDirection:"row",alignItems:"center",gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,marginBottom:spacing.md},searchInput:{flex:1,color:colors.textPrimary,fontSize:13},optionRow:{minHeight:48,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.06)"},optionText:{color:colors.textPrimary,fontSize:13},
});
