"use client";

import { useMemo } from "react";

type TalentBirthDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  isArabic: boolean;
};

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

export default function TalentBirthDatePicker({ value, onChange, isArabic }: TalentBirthDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const parts = parseDate(value);
  const months = isArabic ? MONTHS_AR : MONTHS_EN;

  const years = useMemo(
    () => Array.from({ length: 100 }, (_, index) => currentYear - 13 - index),
    [currentYear],
  );

  const daysInMonth = parts.year && parts.month
    ? new Date(Number(parts.year), Number(parts.month), 0).getDate()
    : 31;

  const setPart = (part: "year" | "month" | "day", next: string) => {
    const draft = { ...parts, [part]: next };
    if (!draft.year || !draft.month || !draft.day) {
      onChange([draft.year, draft.month, draft.day].every(Boolean)
        ? `${draft.year}-${draft.month}-${draft.day}`
        : "");
      return;
    }

    const maxDay = new Date(Number(draft.year), Number(draft.month), 0).getDate();
    const safeDay = Math.min(Number(draft.day), maxDay).toString().padStart(2, "0");
    onChange(`${draft.year}-${draft.month}-${safeDay}`);
  };

  const selectClass =
    "min-h-14 w-full appearance-none rounded-2xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/10";

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3" dir={isArabic ? "rtl" : "ltr"}>
      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "اليوم" : "Day"}</span>
        <select
          value={parts.day}
          onChange={(event) => setPart("day", event.target.value)}
          className={selectClass}
          aria-label={isArabic ? "اليوم" : "Day"}
        >
          <option value="">{isArabic ? "اختر اليوم" : "Select day"}</option>
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const value = String(day).padStart(2, "0");
            return <option key={value} value={value}>{day}</option>;
          })}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "الشهر" : "Month"}</span>
        <select
          value={parts.month}
          onChange={(event) => setPart("month", event.target.value)}
          className={selectClass}
          aria-label={isArabic ? "الشهر" : "Month"}
        >
          <option value="">{isArabic ? "اختر الشهر" : "Select month"}</option>
          {months.map((month, index) => {
            const monthValue = String(index + 1).padStart(2, "0");
            return <option key={monthValue} value={monthValue}>{month}</option>;
          })}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "السنة" : "Year"}</span>
        <select
          value={parts.year}
          onChange={(event) => setPart("year", event.target.value)}
          className={selectClass}
          aria-label={isArabic ? "السنة" : "Year"}
        >
          <option value="">{isArabic ? "اختر السنة" : "Select year"}</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
    </div>
  );
}
