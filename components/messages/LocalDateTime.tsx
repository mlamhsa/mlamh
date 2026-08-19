"use client";

import {
  useEffect,
  useState,
} from "react";

type LocalDateTimeProps = {
  value: string | null;
  locale: string;
  mode?: "time" | "conversation";
  className?: string;
};

function formatLocalDateTime(
  value: string,
  locale: string,
  mode: "time" | "conversation",
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const formatterLocale =
    locale === "ar"
      ? "ar-SA-u-ca-gregory"
      : "en-US";

  if (mode === "time") {
    return new Intl.DateTimeFormat(
      formatterLocale,
      {
        calendar: "gregory",
        hour: "numeric",
        minute: "2-digit",
      },
    ).format(date);
  }

  const now = new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(
      formatterLocale,
      {
        calendar: "gregory",
        hour: "numeric",
        minute: "2-digit",
      },
    ).format(date);
  }

  const yesterday =
    new Date(now);

  yesterday.setDate(
    now.getDate() - 1,
  );

  const isYesterday =
    date.getFullYear() ===
      yesterday.getFullYear() &&
    date.getMonth() ===
      yesterday.getMonth() &&
    date.getDate() ===
      yesterday.getDate();

  if (isYesterday) {
    return locale === "ar"
      ? "أمس"
      : "Yesterday";
  }

  const sameYear =
    date.getFullYear() ===
    now.getFullYear();

  return new Intl.DateTimeFormat(
    formatterLocale,
    {
      calendar: "gregory",
      day: "numeric",
      month: "short",
      year: sameYear
        ? undefined
        : "numeric",
    },
  ).format(date);
}

export default function LocalDateTime({
  value,
  locale,
  mode = "time",
  className,
}: LocalDateTimeProps) {
  const [
    formattedValue,
    setFormattedValue,
  ] = useState("");

  useEffect(() => {
    if (!value) {
      setFormattedValue("");
      return;
    }

    setFormattedValue(
      formatLocalDateTime(
        value,
        locale,
        mode,
      ),
    );
  }, [
    value,
    locale,
    mode,
  ]);

  if (!value) {
    return null;
  }

  return (
    <time
      dateTime={value}
      className={className}
    >
      {formattedValue}
    </time>
  );
}