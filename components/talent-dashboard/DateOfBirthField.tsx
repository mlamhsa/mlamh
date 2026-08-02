"use client";

import { useMemo, useState } from "react";

type Props = {
  label: string;
  name: string;
  defaultValue?: string | null;
};

type DateParts = {
  day: string;
  month: string;
  year: string;
};

const MONTHS = [
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

function getInitialDateParts(
  defaultValue?: string | null,
): DateParts {
  if (!defaultValue) {
    return {
      day: "",
      month: "",
      year: "",
    };
  }

  const date = new Date(defaultValue);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "",
      month: "",
      year: "",
    };
  }

  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}

function getDaysCount(month: string, year: string) {
  if (!month || !year) {
    return 0;
  }

  return new Date(
    Number(year),
    Number(month),
    0,
  ).getDate();
}

export default function DateOfBirthField({
  name,
  defaultValue,
}: Props) {
  const initialParts = useMemo(
    () => getInitialDateParts(defaultValue),
    [defaultValue],
  );

  const [day, setDay] = useState<string>(
    () => initialParts.day,
  );
  const [month, setMonth] = useState<string>(
    () => initialParts.month,
  );
  const [year, setYear] = useState<string>(
    () => initialParts.year,
  );

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1949 },
        (_, index) => String(currentYear - index),
      ),
    [currentYear],
  );

  const days = useMemo(() => {
    const count = getDaysCount(month, year);

    return Array.from(
      { length: count },
      (_, index) => String(index + 1),
    );
  }, [month, year]);

  function updateMonth(nextMonth: string) {
    setMonth(nextMonth);

    const nextDaysCount = getDaysCount(
      nextMonth,
      year,
    );

    if (
      day &&
      nextDaysCount > 0 &&
      Number(day) > nextDaysCount
    ) {
      setDay("");
    }
  }

  function updateYear(nextYear: string) {
    setYear(nextYear);

    const nextDaysCount = getDaysCount(
      month,
      nextYear,
    );

    if (
      day &&
      nextDaysCount > 0 &&
      Number(day) > nextDaysCount
    ) {
      setDay("");
    }
  }

  const value =
    year && month && day
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={name}
        value={value}
      />

      <div className="grid grid-cols-3 gap-3">
        <select
          value={year}
          onChange={(event) =>
            updateYear(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">السنة</option>

          {years.map((yearOption) => (
            <option
              key={yearOption}
              value={yearOption}
            >
              {yearOption}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(event) =>
            updateMonth(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">الشهر</option>

          {MONTHS.map((monthName, index) => (
            <option
              key={monthName}
              value={String(index + 1)}
            >
              {monthName}
            </option>
          ))}
        </select>

        <select
          value={day}
          onChange={(event) =>
            setDay(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
        >
          <option value="">اليوم</option>

          {days.map((dayOption) => (
            <option
              key={dayOption}
              value={dayOption}
            >
              {dayOption}
            </option>
          ))}
        </select>
      </div>

      {value ? (
        <p className="text-xs text-gold">
          {value}
        </p>
      ) : null}
    </div>
  );
}