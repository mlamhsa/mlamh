"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  label: string;
  name: string;
  defaultValue?: string | null;
};

const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];

export default function DateOfBirthField({
  name,
  defaultValue,
}: Props) {
  const initial = useMemo(() => {
    if (!defaultValue) return null;
    const date = new Date(defaultValue);
    if (isNaN(date.getTime())) return null;
    return date;
  }, [defaultValue]);

  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    if (!initial) return;

    setDay(String(initial.getDate()));
    setMonth(String(initial.getMonth() + 1));
    setYear(String(initial.getFullYear()));
  }, [initial]);

  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    return Array.from({ length: currentYear - 1949 }, (_, i) =>
      String(currentYear - i)
    );
  }, [currentYear]);

  const days = useMemo(() => {
    if (!month || !year) return [];

    const count = new Date(
      Number(year),
      Number(month),
      0
    ).getDate();

    return Array.from({ length: count }, (_, i) =>
      String(i + 1)
    );
  }, [month, year]);

  useEffect(() => {
    if (day && days.length && Number(day) > days.length) {
      setDay("");
    }
  }, [days, day]);

  const value =
    year && month && day
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

  return (
    <div className="space-y-3">
      {/* hidden field */}
      <input type="hidden" name={name} value={value} />

      <div className="grid grid-cols-3 gap-3">

        {/* YEAR */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">السنة</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* MONTH */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">الشهر</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1)}>
              {m}
            </option>
          ))}
        </select>

        {/* DAY */}
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">اليوم</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

      </div>

      {value && (
        <p className="text-xs text-gold">{value}</p>
      )}
    </div>
  );
}