import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";

import { formatGregorianDate, isRtlLocale } from "@/lib/i18n";
import { darkTheme, radii } from "@/lib/theme";

function parseIso(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed : new Date();
}
function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function GregorianDateField({ label, value, onChange, locale, minimumDate, maximumDate, optional = true }: { label: string; value: string; onChange: (value: string) => void; locale: "ar" | "en"; minimumDate?: Date; maximumDate?: Date; optional?: boolean }) {
  const rtl = isRtlLocale(locale);
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIso(value), [value]);
  const display = value ? formatGregorianDate(selected, locale, { year: "numeric", month: "long", day: "numeric" }) : null;
  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "dismissed" || !date) return;
    onChange(toIso(date));
  }
  return <View style={s.field}><Text style={[s.label, txt(rtl)]}>{label}</Text><Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[s.selector, rtl && s.rowRtl]}><CalendarDays size={18} color={darkTheme.accent}/><Text style={[s.value, !display && s.placeholder, txt(rtl)]}>{display ?? (locale === "ar" ? "اختر التاريخ" : "Choose date")}</Text></Pressable>{value && optional ? <Pressable onPress={() => onChange("")} style={s.clear}><Text style={s.clearText}>{locale === "ar" ? "مسح التاريخ" : "Clear date"}</Text></Pressable> : null}{open ? <DateTimePicker value={selected} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} minimumDate={minimumDate} maximumDate={maximumDate} locale={locale === "ar" ? "ar-SA" : "en-US"} onChange={handleChange} /> : null}</View>;
}
function txt(rtl:boolean){return{textAlign:rtl?"right" as const:"left" as const,writingDirection:rtl?"rtl" as const:"ltr" as const}}
const s=StyleSheet.create({field:{gap:7},label:{color:darkTheme.text,fontSize:12,fontWeight:"800"},selector:{minHeight:52,borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.md,backgroundColor:darkTheme.surface,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:13},rowRtl:{flexDirection:"row-reverse"},value:{flex:1,color:darkTheme.text,fontSize:13,fontWeight:"700"},placeholder:{color:darkTheme.muted,fontWeight:"500"},clear:{alignSelf:"flex-start",minHeight:28,justifyContent:"center"},clearText:{color:darkTheme.muted,fontSize:9,fontWeight:"700"}});
