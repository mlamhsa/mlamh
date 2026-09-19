import * as AppleAuthentication from "expo-apple-authentication";
import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { MobileApiError } from "@/src/api/client";
import { completeMobilePublisherOnboarding, finalizeMobileAccount, getMobileAccountContext } from "@/src/domains/account/api";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  PUBLISHER_TYPE_OPTIONS,
  SAUDI_SIGNUP_CITIES,
  TALENT_TYPE_OPTIONS,
} from "@/src/domains/auth/signup-data";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { normalizeInputDigits } from "@/src/i18n/format";
import { signInWithNativeApple } from "@/src/native/apple-auth";
import { signInWithNativeGoogle } from "@/src/native/google-auth";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

type AccountType = "talent" | "publisher";
type Option = { value: string; ar: string; en: string };

function normalizeSaudiPhone(value: string) {
  let digits = normalizeInputDigits(value).replace(/\D/g, "");
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const accountType: AccountType = rawType === "publisher" ? "publisher" : "talent";
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const writingDirection = isArabic ? "rtl" : "ltr";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [talentType, setTalentType] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [publisherType, setPublisherType] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<"google" | "apple" | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedPhone = phone ? `+966${normalizeSaudiPhone(phone)}` : "";
  const isTalent = accountType === "talent";

  useEffect(() => {
    let active = true;
    if (Platform.OS !== "ios") return () => { active = false; };
    void AppleAuthentication.isAvailableAsync()
      .then((available) => { if (active) setAppleAvailable(available); })
      .catch(() => { if (active) setAppleAvailable(false); });
    return () => { active = false; };
  }, []);

  async function finishSocialSignup(providerName?: string | null) {
    try {
      const existing = await getMobileAccountContext();
      if (existing.ok) {
        await session.refresh();
        router.replace("/" as never);
        return;
      }
    } catch (error) {
      if (
        error instanceof MobileApiError &&
        error.status === 409 &&
        error.code === "ACCOUNT_TYPE_UNSUPPORTED"
      ) {
        await session.refresh();
        router.replace("/" as never);
        return;
      }
      if (
        error instanceof MobileApiError &&
        error.status === 409 &&
        (error.code === "TALENT_ONBOARDING_INCOMPLETE" || error.code === "PUBLISHER_ONBOARDING_INCOMPLETE")
      ) {
        const recoveryType = error.code === "TALENT_ONBOARDING_INCOMPLETE" ? "talent" : "publisher";
        router.replace(("/setup-account?type=" + recoveryType + "&source=recovery") as never);
        return;
      }
      if (
        !(error instanceof MobileApiError) ||
        error.status !== 404 ||
        error.code !== "ACCOUNT_NOT_FOUND"
      ) {
        throw error;
      }
    }
    const namePart = providerName?.trim() ? "&name=" + encodeURIComponent(providerName.trim()) : "";
    router.replace(("/setup-account?type=" + accountType + "&source=social" + namePart) as never);
  }

  async function handleGoogleSignup() {
    if (submitting || socialSubmitting) return;
    setSocialSubmitting("google");
    setErrorMessage("");
    try {
      const result = await signInWithNativeGoogle();
      if (!result.ok) {
        if (!result.canceled) setErrorMessage(isArabic ? "تعذر المتابعة باستخدام Google. حاول مرة أخرى." : "Unable to continue with Google. Please try again.");
        return;
      }
      await finishSocialSignup();
    } catch (error) {
      if (error instanceof MobileApiError && error.code === "ACCOUNT_EXISTS_DIFFERENT_IDENTITY") {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        setErrorMessage(isArabic ? "هذا البريد مرتبط بحساب موجود. سجّل الدخول بالطريقة التي استخدمتها سابقًا." : "This email is already registered. Sign in using your original sign-in method.");
      } else {
        setErrorMessage(isArabic ? "تمت محاولة التسجيل عبر Google، لكن تعذر إكمال إعداد الحساب داخل التطبيق. حاول مرة أخرى." : "Google sign-up was attempted, but account setup could not be completed in the app. Please try again.");
      }
    } finally {
      setSocialSubmitting(null);
    }
  }

  async function handleAppleSignup() {
    if (submitting || socialSubmitting) return;
    setSocialSubmitting("apple");
    setErrorMessage("");
    try {
      const result = await signInWithNativeApple();
      if (!result.ok) {
        if (!result.canceled) setErrorMessage(isArabic ? "تعذر المتابعة باستخدام Apple. حاول مرة أخرى." : "Unable to continue with Apple. Please try again.");
        return;
      }
      await finishSocialSignup(result.displayName);
    } catch (error) {
      if (error instanceof MobileApiError && error.code === "ACCOUNT_EXISTS_DIFFERENT_IDENTITY") {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        setErrorMessage(isArabic ? "هذا البريد مرتبط بحساب موجود. سجّل الدخول بالطريقة التي استخدمتها سابقًا." : "This email is already registered. Sign in using your original sign-in method.");
      } else {
        setErrorMessage(isArabic ? "تمت محاولة التسجيل عبر Apple، لكن تعذر إكمال إعداد الحساب داخل التطبيق. حاول مرة أخرى." : "Apple sign-up was attempted, but account setup could not be completed in the app. Please try again.");
      }
    } finally {
      setSocialSubmitting(null);
    }
  }

  async function submit() {
    if (submitting || socialSubmitting) return;
    setErrorMessage("");

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const phoneDigits = normalizeSaudiPhone(phone);

    if (cleanName.length < 2 || cleanName.length > 100) {
      setErrorMessage(isArabic ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrorMessage(isArabic ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
      return;
    }
    if (!/^5\d{8}$/.test(phoneDigits)) {
      setErrorMessage(isArabic ? "أدخل رقم جوال سعودي صحيحًا، مثال: 5XXXXXXXX." : "Enter a valid Saudi mobile number, for example 5XXXXXXXX.");
      return;
    }
    if (isTalent && (!talentType || !nationality || !gender || !city)) {
      setErrorMessage(isArabic ? "أكمل نوع الموهبة والجنسية والجنس والمدينة للمتابعة." : "Complete talent type, nationality, gender, and city to continue.");
      return;
    }
    if (!isTalent && !publisherType) {
      setErrorMessage(isArabic ? "حدد صفة الناشر للمتابعة." : "Choose the publisher type to continue.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage(isArabic ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must contain at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMessage(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage(isArabic ? "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة." : "Accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (isTalent && !acceptedAccuracy) {
      setErrorMessage(isArabic ? "أكد دقة البيانات والموافقة على التواصل للمتابعة." : "Confirm data accuracy and contact consent to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: isTalent ? cleanName : null,
            contact_name: accountType === "publisher" ? cleanName : null,
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
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: now,
            data_accuracy_contact_consent: isTalent ? true : null,
            data_accuracy_contact_consent_at: isTalent ? now : null,
          },
        },
      });

      if (error) {
        setErrorMessage(isArabic ? "تعذر إنشاء الحساب حاليًا. تحقق من البيانات وحاول مرة أخرى." : "Could not create your account. Check your details and try again.");
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrorMessage(isArabic ? "هذا البريد مسجل مسبقًا. سجّل الدخول أو استعد كلمة المرور." : "This email is already registered. Sign in or reset your password.");
        return;
      }

      if (data.session && data.user) {
        await finalizeMobileAccount({ displayName: cleanName, phone: normalizedPhone, accountType });
        if (!isTalent) {
          await completeMobilePublisherOnboarding({
            publisherMode: publisherType === "individual" ? "individual" : "organization",
            publisherType,
          });
        }
        await session.refresh();
        router.replace("/" as never);
        return;
      }

      router.replace(`/verify-email?email=${encodeURIComponent(cleanEmail)}&type=${accountType}` as never);
    } catch {
      setErrorMessage(isArabic ? "حدث خطأ أثناء إنشاء الحساب. تحقق من اتصالك وحاول مرة أخرى." : "An error occurred while creating your account. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "إنشاء حساب" : "CREATE ACCOUNT"}</Text>
          <Text style={[styles.title, { textAlign: align, writingDirection }]}>
            {isTalent ? (isArabic ? "ابدأ ملفك كموهبة" : "Start your talent profile") : (isArabic ? "ابدأ البحث عن المواهب" : "Start finding talent")}
          </Text>
          <Text style={[styles.subtitle, { textAlign: align, writingDirection }]}>
            {isTalent
              ? (isArabic ? "أدخل بياناتك الأساسية الآن، ثم أكمل ملفك المهني بعد تأكيد البريد." : "Enter your basic details now, then complete your professional profile after email verification.")
              : (isArabic ? "للأفراد وأصحاب المشاريع والمتاجر والشركات والوكالات الباحثة عن المواهب." : "For individuals, businesses, companies, agencies, and organizations looking for talent.")}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.socialBlock}>
            <Pressable accessibilityRole="button" disabled={Boolean(socialSubmitting) || submitting} onPress={() => void handleGoogleSignup()} style={({ pressed }) => [styles.googleButton, (socialSubmitting || submitting) && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.googleText}>{socialSubmitting === "google" ? (isArabic ? "جارٍ فتح Google…" : "Opening Google…") : (isArabic ? "المتابعة باستخدام Google" : "Continue with Google")}</Text>
            </Pressable>
            {Platform.OS === "ios" ? (appleAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE} buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE} cornerRadius={14} style={[styles.appleButton, (socialSubmitting || submitting) && styles.disabled]} onPress={() => void handleAppleSignup()} />
            ) : (
              <View style={styles.appleFallback}><Text style={styles.appleMark}></Text><Text style={styles.appleFallbackText}>{isArabic ? "المتابعة باستخدام Apple" : "Continue with Apple"}</Text></View>
            )) : null}
            <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>{isArabic ? "أو بالبريد الإلكتروني" : "OR WITH EMAIL"}</Text><View style={styles.divider} /></View>
          </View>
          <Field label={isTalent ? (isArabic ? "الاسم الكامل" : "Full name") : (isArabic ? "اسم المسؤول" : "Contact person name")} isArabic={isArabic}>
            <TextInput value={fullName} onChangeText={setFullName} autoComplete="name" placeholder={isArabic ? "اكتب الاسم" : "Enter name"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection }]} />
          </Field>

          <Field label={isArabic ? "البريد الإلكتروني" : "Email"} isArabic={isArabic}>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="name@example.com" placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: "left", writingDirection: "ltr" }]} />
          </Field>

          <Field label={isArabic ? "رقم الجوال" : "Mobile number"} isArabic={isArabic}>
            <View style={[styles.phoneShell, isArabic && styles.rowReverse]}>
              <View style={styles.dialCode}><Text style={styles.dialCodeText}>+966</Text></View>
              <TextInput value={phone} onChangeText={(value) => setPhone(normalizeSaudiPhone(value))} keyboardType="phone-pad" textContentType="telephoneNumber" placeholder="5XXXXXXXX" placeholderTextColor={colors.textMuted} style={styles.phoneInput} maxLength={9} />
            </View>
          </Field>

          {!isTalent ? (
            <Field label={isArabic ? "صفة الناشر" : "Publisher type"} isArabic={isArabic}>
              <ChoiceRow options={PUBLISHER_TYPE_OPTIONS} value={publisherType} onChange={setPublisherType} isArabic={isArabic} wrap />
            </Field>
          ) : null}

          {isTalent ? (
            <>
              <Field label={isArabic ? "نوع الموهبة" : "Talent type"} isArabic={isArabic}>
                <ChoiceRow options={TALENT_TYPE_OPTIONS} value={talentType} onChange={setTalentType} isArabic={isArabic} />
              </Field>

              <Field label={isArabic ? "الجنسية" : "Nationality"} isArabic={isArabic}>
                <OptionPicker title={isArabic ? "اختر الجنسية" : "Choose nationality"} options={NATIONALITY_OPTIONS} value={nationality} onChange={setNationality} isArabic={isArabic} searchable />
              </Field>

              <Field label={isArabic ? "الجنس" : "Gender"} isArabic={isArabic}>
                <ChoiceRow options={GENDER_OPTIONS} value={gender} onChange={setGender} isArabic={isArabic} wrap />
              </Field>

              <Field label={isArabic ? "مدينة الإقامة" : "City of residence"} isArabic={isArabic}>
                <OptionPicker title={isArabic ? "اختر المدينة" : "Choose city"} options={SAUDI_SIGNUP_CITIES} value={city} onChange={setCity} isArabic={isArabic} searchable />
              </Field>

              <Field label={isArabic ? "خصوصية الملف" : "Profile visibility"} isArabic={isArabic}>
                <ChoiceRow options={PROFILE_VISIBILITY_OPTIONS} value={profileVisibility} onChange={(value) => setProfileVisibility(value as "public" | "private")} isArabic={isArabic} wrap />
              </Field>
            </>
          ) : null}

          <Field label={isArabic ? "كلمة المرور" : "Password"} isArabic={isArabic}>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection }]} />
          </Field>

          <Field label={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} isArabic={isArabic}>
            <TextInput value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" placeholder={isArabic ? "أعد كتابة كلمة المرور" : "Re-enter password"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection }]} />
          </Field>

          <ConsentRow checked={acceptedTerms} onPress={() => setAcceptedTerms((value) => !value)} text={isArabic ? "أوافق على الشروط وسياسة الخصوصية." : "I agree to the Terms and Privacy Policy."} isArabic={isArabic} />
          {isTalent ? <ConsentRow checked={acceptedAccuracy} onPress={() => setAcceptedAccuracy((value) => !value)} text={isArabic ? "أؤكد دقة البيانات وأوافق على التواصل المتعلق بالفرص والحساب." : "I confirm my data is accurate and consent to account/opportunity contact."} isArabic={isArabic} /> : null}

          {errorMessage ? <Text style={[styles.error, { textAlign: align, writingDirection }]}>{errorMessage}</Text> : null}

          <Pressable disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, submitting && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.submitText}>{submitting ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : (isArabic ? "إنشاء الحساب والمتابعة" : "Create account and continue")}</Text>
          </Pressable>

          <Pressable onPress={() => router.replace("/login" as never)} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, isArabic, children }: { label: string; isArabic: boolean; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={[styles.label, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{label}<Text style={styles.required}> *</Text></Text>{children}</View>;
}

function ChoiceRow({ options, value, onChange, isArabic, wrap = false }: { options: readonly Option[]; value: string; onChange: (value: string) => void; isArabic: boolean; wrap?: boolean }) {
  return <View style={[styles.choices, wrap && styles.wrap, isArabic && styles.rowReverse]}>{options.map((option) => { const active = option.value === value; return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{isArabic ? option.ar : option.en}</Text></Pressable>; })}</View>;
}

function ConsentRow({ checked, onPress, text, isArabic }: { checked: boolean; onPress: () => void; text: string; isArabic: boolean }) {
  return <Pressable onPress={onPress} style={[styles.consentRow, isArabic && styles.rowReverse]}><View style={[styles.checkbox, checked && styles.checkboxActive]}>{checked ? <Check size={14} color="#080808" strokeWidth={2.5} /> : null}</View><Text style={[styles.consentText, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{text}</Text></Pressable>;
}

function OptionPicker({ title, options, value, onChange, isArabic, searchable = false }: { title: string; options: readonly Option[]; value: string; onChange: (value: string) => void; isArabic: boolean; searchable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => `${option.ar} ${option.en} ${option.value}`.toLowerCase().includes(needle));
  }, [options, query]);

  return <>
    <Pressable onPress={() => setOpen(true)} style={[styles.pickerButton, isArabic && styles.rowReverse]}>
      <Text numberOfLines={1} style={[styles.pickerText, !selected && styles.pickerPlaceholder, { textAlign: isArabic ? "right" : "left" }]}>{selected ? (isArabic ? selected.ar : selected.en) : title}</Text>
      <ChevronDown size={18} color={colors.textMuted} />
    </Pressable>
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
      <View style={styles.modalScreen}>
        <View style={[styles.modalHeader, isArabic && styles.rowReverse]}><Text style={[styles.modalTitle, { textAlign: isArabic ? "right" : "left" }]}>{title}</Text><Pressable onPress={() => setOpen(false)} style={styles.close}><X size={21} color={colors.textPrimary} /></Pressable></View>
        {searchable ? <View style={[styles.searchBox, isArabic && styles.rowReverse]}><Search size={18} color={colors.gold} /><TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث…" : "Search…"} placeholderTextColor={colors.textMuted} style={[styles.searchInput, { textAlign: isArabic ? "right" : "left" }]} /></View> : null}
        <FlatList data={filtered as Option[]} keyExtractor={(item) => item.value} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.optionList} renderItem={({ item }) => { const active = item.value === value; return <Pressable onPress={() => { onChange(item.value); setOpen(false); setQuery(""); }} style={[styles.optionRow, isArabic && styles.rowReverse, active && styles.optionRowActive]}><Text style={[styles.optionLabel, active && styles.optionLabelActive, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? item.ar : item.en}</Text>{active ? <Check size={18} color={colors.gold} /> : null}</Pressable>; }} />
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 72 },
  heading: { marginBottom: spacing.xl },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 38, fontWeight: "700", marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg, gap: spacing.lg },
  socialBlock: { gap: spacing.md, marginBottom: spacing.sm },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 9, fontWeight: "700" },
  googleButton: { width: "100%", height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md, borderRadius: 14, backgroundColor: "#FFFFFF" },
  googleMark: { color: "#111111", fontSize: 19, fontWeight: "800" },
  googleText: { color: "#111111", fontSize: 14, fontWeight: "700" },
  appleButton: { width: "100%", height: 54 },
  appleFallback: { width: "100%", height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: 14, backgroundColor: "#FFFFFF" },
  appleMark: { color: "#000000", fontSize: 21, fontWeight: "700" },
  appleFallbackText: { color: "#000000", fontSize: 14, fontWeight: "700" },
  field: { gap: spacing.sm },
  label: { color: "rgba(255,255,255,0.68)", fontSize: 12, fontWeight: "600" },
  required: { color: colors.gold },
  input: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.28)", color: colors.textPrimary, paddingHorizontal: spacing.lg, fontSize: 14 },
  phoneShell: { flexDirection: "row", gap: spacing.sm },
  rowReverse: { flexDirection: "row-reverse" },
  dialCode: { minWidth: 78, minHeight: 56, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.03)" },
  dialCodeText: { color: colors.textSecondary, fontSize: 14 },
  phoneInput: { flex: 1, minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.28)", color: colors.textPrimary, paddingHorizontal: spacing.lg, fontSize: 15, textAlign: "left", writingDirection: "ltr" },
  choices: { flexDirection: "row", gap: spacing.sm },
  wrap: { flexWrap: "wrap" },
  choice: { flexGrow: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.025)", paddingHorizontal: spacing.md },
  choiceActive: { borderColor: "rgba(201,169,98,0.48)", backgroundColor: "rgba(201,169,98,0.12)" },
  choiceText: { color: colors.textMuted, fontSize: 12 },
  choiceTextActive: { color: colors.goldSoft, fontWeight: "700" },
  pickerButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.28)", paddingHorizontal: spacing.lg },
  pickerText: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  pickerPlaceholder: { color: colors.textMuted },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxActive: { borderColor: colors.goldSoft, backgroundColor: colors.goldSoft },
  consentText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 20 },
  error: { color: "#FCA5A5", fontSize: 12, lineHeight: 20, borderWidth: 1, borderColor: "rgba(248,113,113,0.24)", backgroundColor: "rgba(248,113,113,0.08)", borderRadius: radius.lg, padding: spacing.md },
  submit: { minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  submitText: { color: "#080808", fontSize: 14, fontWeight: "800" },
  loginLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  loginLinkText: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  modalScreen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  modalTitle: { flex: 1, color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  close: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  searchBox: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg, marginVertical: spacing.md },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  optionList: { paddingBottom: 32 },
  optionRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingHorizontal: spacing.sm },
  optionRowActive: { backgroundColor: "rgba(201,169,98,0.06)" },
  optionLabel: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  optionLabelActive: { color: colors.goldSoft, fontWeight: "700" },
});
