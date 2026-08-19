type DaySeparatorProps = {
  value: string;
  locale: string;
};

const RIYADH_TIME_ZONE =
  "Asia/Riyadh";

const ARABIC_MONTHS = [
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

const ENGLISH_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ARABIC_WEEKDAYS: Record<
  string,
  string
> = {
  Sun: "الأحد",
  Mon: "الاثنين",
  Tue: "الثلاثاء",
  Wed: "الأربعاء",
  Thu: "الخميس",
  Fri: "الجمعة",
  Sat: "السبت",
};

const ENGLISH_WEEKDAYS: Record<
  string,
  string
> = {
  Sun: "Sun",
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
};

type RiyadhDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: string;
};

function getRiyadhDateParts(
  date: Date,
): RiyadhDateParts {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US-u-ca-gregory",
      {
        timeZone:
          RIYADH_TIME_ZONE,
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
      },
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const getPart = (
    type:
      | "year"
      | "month"
      | "day"
      | "weekday",
  ) =>
    parts.find(
      (part) =>
        part.type === type,
    )?.value ?? "";

  return {
    year:
      Number(
        getPart("year"),
      ) || 0,

    month:
      Number(
        getPart("month"),
      ) || 0,

    day:
      Number(
        getPart("day"),
      ) || 0,

    weekday:
      getPart("weekday"),
  };
}

function getDateKey(
  date: Date,
) {
  const parts =
    getRiyadhDateParts(
      date,
    );

  return [
    parts.year,
    String(
      parts.month,
    ).padStart(2, "0"),
    String(
      parts.day,
    ).padStart(2, "0"),
  ].join("-");
}

function formatArabicNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "ar-SA",
    {
      useGrouping: false,
    },
  ).format(value);
}

function formatDay(
  value: string,
  locale: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const today =
    new Date();

  const yesterday =
    new Date(
      today.getTime() -
        24 *
          60 *
          60 *
          1000,
    );

  const dateKey =
    getDateKey(date);

  const todayKey =
    getDateKey(today);

  const yesterdayKey =
    getDateKey(
      yesterday,
    );

  if (
    dateKey === todayKey
  ) {
    return locale === "ar"
      ? "اليوم"
      : "Today";
  }

  if (
    dateKey ===
    yesterdayKey
  ) {
    return locale === "ar"
      ? "أمس"
      : "Yesterday";
  }

  const dateParts =
    getRiyadhDateParts(
      date,
    );

  const todayParts =
    getRiyadhDateParts(
      today,
    );

  const includeYear =
    dateParts.year !==
    todayParts.year;

  if (locale === "ar") {
    const weekday =
      ARABIC_WEEKDAYS[
        dateParts.weekday
      ] ?? "";

    const month =
      ARABIC_MONTHS[
        dateParts.month - 1
      ] ?? "";

    const day =
      formatArabicNumber(
        dateParts.day,
      );

    const year =
      formatArabicNumber(
        dateParts.year,
      );

    return includeYear
      ? `${weekday}، ${day} ${month} ${year}`
      : `${weekday}، ${day} ${month}`;
  }

  const weekday =
    ENGLISH_WEEKDAYS[
      dateParts.weekday
    ] ?? "";

  const month =
    ENGLISH_MONTHS[
      dateParts.month - 1
    ] ?? "";

  return includeYear
    ? `${weekday}, ${month} ${dateParts.day}, ${dateParts.year}`
    : `${weekday}, ${month} ${dateParts.day}`;
}

export default function DaySeparator({
  value,
  locale,
}: DaySeparatorProps) {
  return (
    <div className="my-4 flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />

      <span className="shrink-0 rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[10px] text-white/45 shadow-lg shadow-black/20 backdrop-blur-xl">
        {formatDay(
          value,
          locale,
        )}
      </span>

      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}