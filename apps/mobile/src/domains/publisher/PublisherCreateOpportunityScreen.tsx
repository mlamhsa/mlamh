import { router, useLocalSearchParams } from "expo-router";
import { BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Search, Zap } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { MobileApiError } from "@/src/api/client";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { createPublisherOpportunity, getPublisherProfileOptions } from "@/src/domains/publisher/api";
import type {
  MobileProfileOption,
  PublisherCompensationType,
  PublisherOpportunityMode,
  PublisherRequiredGender,
  PublisherTalentType,
} from "@/src/domains/publisher/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

function numberValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PublisherCreateOpportunityScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const account = session.status === "publisher" ? session.account : null;

  const [mode, setMode] = useState<PublisherOpportunityMode>(rawMode === "casting" ? "casting" : "quick");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [talentType, setTalentType] = useState<PublisherTalentType>("actor");
  const [gender, setGender] = useState<PublisherRequiredGender>("any");
  const [compensation, setCompensation] = useState<PublisherCompensationType>("negotiable");
  const [budget, setBudget] = useState("");
  const [applicationDays, setApplicationDays] = useState("7");
  const [requiredCount, setRequiredCount] = useState("1");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [workTime, setWorkTime] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [cities, setCities] = useState<MobileProfileOption[]>([]);
  const [city, setCity] = useState<MobileProfileOption | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPublisherProfileOptions()
      .then((result) => { if (active) setCities(result.cities); })
      .catch(() => { if (active) setError(isArabic ? "تعذر تحميل المدن." : "Unable to load cities."); })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, [isArabic]);

  const canUseMode = useCallback((candidate: PublisherOpportunityMode) => {
    if (!account) return false;
    return candidate === "quick" ? account.capabilities.canCreateQuick : account.capabilities.canCreateCasting;
  }, [account]);

  useEffect(() => {
    if (!account) return;
    if (!canUseMode(mode)) {
      const fallback: PublisherOpportunityMode | null = account.capabilities.canCreateQuick
        ? "quick"
        : account.capabilities.canCreateCasting
          ? "casting"
          : null;
      if (fallback) setMode(fallback);
    }
  }, [account, canUseMode, mode]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities.slice(0, 12);
    return cities.filter((item) => `${item.ar} ${item.en} ${item.value}`.toLowerCase().includes(q)).slice(0, 18);
  }, [cities, cityQuery]);

  const submit = useCallback(async () => {
    if (!account?.capabilities.canCreate || !canUseMode(mode)) {
      setError(isArabic ? "حسابك غير مخول لإنشاء هذا النوع من الفرص." : "Your account cannot create this opportunity type.");
      return;
    }
    if (!city) {
      setError(isArabic ? "اختر مدينة الفرصة." : "Choose an opportunity city.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError(isArabic ? "العنوان والوصف مطلوبان." : "Title and description are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createPublisherOpportunity({
        locale,
        postingMode: mode,
        title: title.trim(),
        description: description.trim(),
        city: city.value,
        requiredGender: gender,
        minAge: numberValue(minAge),
        maxAge: numberValue(maxAge),
        compensationType: compensation,
        budget: compensation === "fixed" ? budget.trim() : null,
        talentType,
        applicationDays: numberValue(applicationDays) ?? 7,
        requiredCount: numberValue(requiredCount),
        workDate: workDate.trim() || null,
        workTime: workTime.trim() || null,
        workDuration: workDuration.trim() || null,
      });
      setSuccess(result.message);
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "CREATE_FAILED";
      const message = caught instanceof MobileApiError ? caught.message : "";
      setError(message || (code === "RATE_LIMITED"
        ? (isArabic ? "تم إنشاء عدة فرص خلال وقت قصير. حاول لاحقًا." : "Too many creation attempts. Try again later.")
        : (isArabic ? "تعذر إرسال الفرصة للمراجعة." : "Unable to submit the opportunity for review.")));
    } finally {
      setSubmitting(false);
    }
  }, [account, applicationDays, budget, canUseMode, city, compensation, description, gender, isArabic, locale, maxAge, minAge, mode, requiredCount, talentType, title, workDate, workDuration, workTime]);

  if (!account) {
    return <View style={styles.safeArea}><View style={styles.center}><Text style={styles.muted}>{isArabic ? "هذه الشاشة مخصصة لحساب الناشر." : "Publisher account required."}</Text></View></View>;
  }

  if (success) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.successWrap}>
          <CheckCircle2 size={44} color={colors.gold} />
          <Text style={styles.successTitle}>{isArabic ? "تم إرسال الفرصة للمراجعة" : "Opportunity submitted"}</Text>
          <Text style={styles.successText}>{success}</Text>
          <Pressable onPress={() => router.replace("/publisher-home" as never)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{isArabic ? "العودة للرئيسية" : "Back to home"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, isArabic && styles.rowReverse]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><BackIcon size={19} color={colors.textSecondary} /></Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "إنشاء فرصة" : "CREATE"}</Text>
            <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "ما الذي تبحث عنه؟" : "What are you looking for?"}</Text>
          </View>
        </View>

        <View style={[styles.modeGrid, isArabic && styles.rowReverse]}>
          <ModeCard mode="quick" active={mode === "quick"} disabled={!canUseMode("quick")} isArabic={isArabic} onPress={() => setMode("quick")} />
          <ModeCard mode="casting" active={mode === "casting"} disabled={!canUseMode("casting")} isArabic={isArabic} onPress={() => setMode("casting")} />
        </View>

        <Field isArabic={isArabic} label={isArabic ? "عنوان الفرصة" : "Title"}><TextInput value={title} onChangeText={setTitle} maxLength={120} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={isArabic ? "مثال: مودل لتصوير منتج" : "e.g. Model for product shoot"} placeholderTextColor={colors.textMuted} /></Field>
        <Field isArabic={isArabic} label={isArabic ? "الوصف" : "Description"}><TextInput value={description} onChangeText={setDescription} maxLength={2000} multiline style={[styles.input, styles.textarea, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={isArabic ? "صف المهمة والمتطلبات الأساسية..." : "Describe the work and key requirements..."} placeholderTextColor={colors.textMuted} /></Field>

        <Field isArabic={isArabic} label={isArabic ? "نوع الموهبة" : "Talent type"}><ChoiceRow isArabic={isArabic} options={[{ value: "actor", label: isArabic ? "ممثل" : "Actor" }, { value: "model", label: isArabic ? "مودل" : "Model" }]} value={talentType} onChange={(value) => setTalentType(value as PublisherTalentType)} /></Field>
        <Field isArabic={isArabic} label={isArabic ? "الجنس المطلوب" : "Required gender"}><ChoiceRow isArabic={isArabic} options={[{ value: "any", label: isArabic ? "الكل" : "Any" }, { value: "male", label: isArabic ? "ذكر" : "Male" }, { value: "female", label: isArabic ? "أنثى" : "Female" }]} value={gender} onChange={(value) => setGender(value as PublisherRequiredGender)} /></Field>

        <Field isArabic={isArabic} label={isArabic ? "المدينة" : "City"}>
          {city ? <Pressable onPress={() => setCity(null)} style={[styles.selectedCity, isArabic && styles.rowReverse]}><Text style={styles.selectedCityText}>{isArabic ? city.ar : city.en}</Text><Text style={styles.changeText}>{isArabic ? "تغيير" : "Change"}</Text></Pressable> : (
            <>
              <View style={[styles.searchWrap, isArabic && styles.rowReverse]}><Search size={15} color={colors.textMuted} /><TextInput value={cityQuery} onChangeText={setCityQuery} style={[styles.citySearch, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={loadingOptions ? (isArabic ? "جارٍ تحميل المدن..." : "Loading cities...") : (isArabic ? "ابحث عن مدينة" : "Search cities")} placeholderTextColor={colors.textMuted} /></View>
              <View style={[styles.cityList, isArabic && styles.rowReverse]}>{filteredCities.map((item) => <Pressable key={item.value} onPress={() => { setCity(item); setCityQuery(""); }} style={styles.cityChip}><Text style={styles.cityChipText}>{isArabic ? item.ar : item.en}</Text></Pressable>)}</View>
            </>
          )}
        </Field>

        <Field isArabic={isArabic} label={isArabic ? "المقابل" : "Compensation"}><ChoiceRow isArabic={isArabic} options={[{ value: "fixed", label: isArabic ? "مبلغ محدد" : "Fixed" }, { value: "negotiable", label: isArabic ? "قابل للتفاوض" : "Negotiable" }, { value: "unpaid", label: isArabic ? "بدون مقابل" : "Unpaid" }]} value={compensation} onChange={(value) => setCompensation(value as PublisherCompensationType)} /></Field>
        {compensation === "fixed" ? <Field isArabic={isArabic} label={isArabic ? "الميزانية (ر.س)" : "Budget (SAR)"}><TextInput value={budget} onChangeText={setBudget} keyboardType="number-pad" style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder="1500" placeholderTextColor={colors.textMuted} /></Field> : null}

        <View style={[styles.twoCols, isArabic && styles.rowReverse]}>
          <CompactField isArabic={isArabic} label={isArabic ? "العدد المطلوب" : "Count"} value={requiredCount} onChangeText={setRequiredCount} />
          <CompactField isArabic={isArabic} label={isArabic ? "أيام التقديم" : "Apply days"} value={applicationDays} onChangeText={setApplicationDays} />
        </View>
        <View style={[styles.twoCols, isArabic && styles.rowReverse]}>
          <CompactField isArabic={isArabic} label={isArabic ? "العمر من" : "Min age"} value={minAge} onChangeText={setMinAge} />
          <CompactField isArabic={isArabic} label={isArabic ? "العمر إلى" : "Max age"} value={maxAge} onChangeText={setMaxAge} />
        </View>

        {mode === "casting" ? (
          <View style={styles.optionalBox}>
            <Text style={[styles.optionalTitle, { textAlign: align }]}>{isArabic ? "تفاصيل العمل — اختيارية" : "Work details — optional"}</Text>
            <TextInput value={workDate} onChangeText={setWorkDate} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={isArabic ? "تاريخ العمل YYYY-MM-DD" : "Work date YYYY-MM-DD"} placeholderTextColor={colors.textMuted} />
            <TextInput value={workTime} onChangeText={setWorkTime} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={isArabic ? "الوقت HH:MM" : "Time HH:MM"} placeholderTextColor={colors.textMuted} />
            <TextInput value={workDuration} onChangeText={setWorkDuration} maxLength={120} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} placeholder={isArabic ? "مدة العمل" : "Work duration"} placeholderTextColor={colors.textMuted} />
          </View>
        ) : null}

        <Text style={[styles.reviewNote, { textAlign: align }]}>{isArabic ? "لن تُنشر الفرصة مباشرة. تُرسل أولًا إلى فريق ملامح للمراجعة والاعتماد." : "The opportunity is submitted to MLAMH for review before it is published."}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable disabled={submitting || !account.capabilities.canCreate} onPress={() => void submit()} style={[styles.submitButton, (submitting || !account.capabilities.canCreate) && styles.disabled]}>
          <Text style={styles.submitText}>{submitting ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : (isArabic ? "إرسال للمراجعة" : "Submit for review")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ModeCard({ mode, active, disabled, isArabic, onPress }: { mode: PublisherOpportunityMode; active: boolean; disabled: boolean; isArabic: boolean; onPress: () => void }) {
  const Icon = mode === "quick" ? Zap : BriefcaseBusiness;
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.modeCard, active && styles.modeCardActive, disabled && styles.disabled]}><Icon size={20} color={active ? colors.gold : colors.textMuted} /><Text style={[styles.modeTitle, active && styles.modeTitleActive, { textAlign: isArabic ? "right" : "left" }]}>{mode === "quick" ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}</Text><Text style={[styles.modeDesc, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{mode === "quick" ? (isArabic ? "احتياج سريع ومباشر" : "Fast, direct need") : (isArabic ? "فرصة أوسع بمراحل اختيار" : "Structured casting flow")}</Text></Pressable>;
}

function Field({ label, children, isArabic }: { label: string; children: React.ReactNode; isArabic: boolean }) { return <View style={styles.field}><Text style={[styles.label, { textAlign: isArabic ? "right" : "left" }]}>{label}</Text>{children}</View>; }
function CompactField({ label, value, onChangeText, isArabic }: { label: string; value: string; onChangeText: (value: string) => void; isArabic: boolean }) { return <View style={styles.compactField}><Text style={[styles.label, { textAlign: isArabic ? "right" : "left" }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="number-pad" style={[styles.input, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]} placeholderTextColor={colors.textMuted} /></View>; }
function ChoiceRow({ options, value, onChange, isArabic }: { options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void; isArabic: boolean }) { return <View style={[styles.choiceRow, isArabic && styles.rowReverse]}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, value === option.value && styles.choiceActive]}><Text style={[styles.choiceText, value === option.value && styles.choiceTextActive]}>{option.label}</Text></Pressable>)}</View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, rowReverse: { flexDirection: "row-reverse" }, content: { paddingHorizontal: spacing.lg, paddingBottom: 64 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }, muted: { color: colors.textMuted },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.lg }, backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "800" }, title: { color: colors.textPrimary, fontSize: 27, fontWeight: "700", marginTop: 4 },
  modeGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl }, modeCard: { flex: 1, minHeight: 125, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.lg }, modeCardActive: { borderColor: "rgba(201,169,98,0.42)", backgroundColor: "rgba(201,169,98,0.07)" }, modeTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: "700", marginTop: spacing.sm }, modeTitleActive: { color: colors.gold }, modeDesc: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  field: { marginTop: spacing.xl }, compactField: { flex: 1 }, label: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: spacing.sm }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, color: colors.textPrimary, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: 13 }, textarea: { minHeight: 120, textAlignVertical: "top" }, twoCols: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, choice: { minHeight: 38, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.lg, backgroundColor: colors.surface }, choiceActive: { borderColor: "rgba(201,169,98,0.4)", backgroundColor: "rgba(201,169,98,0.08)" }, choiceText: { color: colors.textMuted, fontSize: 11 }, choiceTextActive: { color: colors.gold, fontWeight: "700" },
  searchWrap: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.md }, citySearch: { flex: 1, color: colors.textPrimary, fontSize: 13 }, cityList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }, cityChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 }, cityChipText: { color: colors.textSecondary, fontSize: 10 }, selectedCity: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(201,169,98,0.3)", borderRadius: radius.lg, backgroundColor: "rgba(201,169,98,0.06)", paddingHorizontal: spacing.md }, selectedCityText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" }, changeText: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  optionalBox: { marginTop: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg, backgroundColor: "rgba(255,255,255,0.018)" }, optionalTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", marginBottom: 2 }, reviewNote: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: spacing.xl }, errorText: { color: "#E9A8A8", fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: spacing.md }, submitButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: colors.gold, marginTop: spacing.lg }, submitText: { color: "#090909", fontSize: 13, fontWeight: "800" }, disabled: { opacity: 0.4 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl }, successTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: spacing.lg }, successText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, textAlign: "center", marginTop: spacing.sm }, primaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: colors.gold, paddingHorizontal: spacing.xxl, marginTop: spacing.xl }, primaryButtonText: { color: "#090909", fontSize: 12, fontWeight: "800" },
});
