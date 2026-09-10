"use client";

import { useEffect, useMemo, useState } from "react";

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
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const initial = parseDate(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  useEffect(() => {
    const next = parseDate(value);
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  }, [value]);

  const years = useMemo(
    () => Array.from({ length: 100 }, (_, index) => currentYear - 13 - index),
    [currentYear],
  );

  const daysInMonth = year && month
    ? new Date(Number(year), Number(month), 0).getDate()
    : 31;

  function emit(nextYear: string, nextMonth: string, nextDay: string) {
    if (!nextYear || !nextMonth || !nextDay) return;
    const maxDay = new Date(Number(nextYear), Number(nextMonth), 0).getDate();
    const safeDay = Math.min(Number(nextDay), maxDay).toString().padStart(2, "0");
    if (safeDay !== nextDay) setDay(safeDay);
    onChange(`${nextYear}-${nextMonth}-${safeDay}`);
  }

  function changeYear(next: string) {
    setYear(next);
    emit(next, month, day);
  }

  function changeMonth(next: string) {
    setMonth(next);
    emit(year, next, day);
  }

  function changeDay(next: string) {
    setDay(next);
    emit(year, month, next);
  }

  const selectClass =
    "min-h-14 w-full appearance-none rounded-2xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/10";

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3" dir={isArabic ? "rtl" : "ltr"}>
      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "اليوم" : "Day"}</span>
        <select value={day} onChange={(event) => changeDay(event.target.value)} className={selectClass} aria-label={isArabic ? "اليوم" : "Day"}>
          <option value="">{isArabic ? "اختر اليوم" : "Select day"}</option>
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((dayNumber) => {
            const optionValue = String(dayNumber).padStart(2, "0");
            return <option key={optionValue} value={optionValue}>{dayNumber}</option>;
          })}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "الشهر" : "Month"}</span>
        <select value={month} onChange={(event) => changeMonth(event.target.value)} className={selectClass} aria-label={isArabic ? "الشهر" : "Month"}>
          <option value="">{isArabic ? "اختر الشهر" : "Select month"}</option>
          {months.map((monthLabel, index) => {
            const monthValue = String(index + 1).padStart(2, "0");
            return <option key={monthValue} value={monthValue}>{monthLabel}</option>;
          })}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/45">{isArabic ? "السنة" : "Year"}</span>
        <select value={year} onChange={(event) => changeYear(event.target.value)} className={selectClass} aria-label={isArabic ? "السنة" : "Year"}>
          <option value="">{isArabic ? "اختر السنة" : "Select year"}</option>
          {years.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
        </select>
      </label>
    </div>
  );
}
