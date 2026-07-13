"use client";

import { useRef } from "react";

type FieldValue =
  | string
  | number
  | string[]
  | null
  | undefined;

type BaseFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  value?: FieldValue;
  defaultValue?: FieldValue;
  onChange?: (value: any) => void;
  placeholder?: string;
};

type Option = {
  value: string;
  label: string;
};

function resolveValue(
  value: FieldValue,
  defaultValue: FieldValue
) {
  return value ?? defaultValue ?? "";
}

/* =========================
   TEXT FIELD
========================= */

export function TextField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = "",
  placeholder,
  dir = "ltr",
  type = "text",
}: BaseFieldProps & {
  dir?: "ltr" | "rtl";
  type?:
    | "text"
    | "number"
    | "email"
    | "url"
    | "tel"
    | "password"
    | "date";
}) {
  const inputValue = resolveValue(
    value,
    defaultValue
  );

  const isDateField = type === "date";
  const inputRef =
    useRef<HTMLInputElement>(null);

  function openDatePicker() {
    const input = inputRef.current;

    if (!input) return;

    try {
      if (
        typeof input.showPicker === "function"
      ) {
        input.showPicker();
      } else {
        input.focus();
        input.click();
      }
    } catch {
      input.focus();
    }
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          type={type}
          value={
            inputValue as string | number
          }
          required={required}
          placeholder={placeholder}
          dir={dir}
          onChange={(event) =>
            onChange?.(event.target.value)
          }
          className={`w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40 ${
            isDateField
              ? dir === "rtl"
                ? "pl-14"
                : "pr-14"
              : ""
          }`}
        />

        {isDateField ? (
          <button
            type="button"
            onClick={openDatePicker}
            aria-label={
              dir === "rtl"
                ? "فتح التقويم"
                : "Open calendar"
            }
            className={`absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-gold/30 bg-gold/[0.08] text-gold transition hover:border-gold/60 hover:bg-gold/15 focus:outline-none focus:ring-2 focus:ring-gold/30 ${
              dir === "rtl"
                ? "left-3"
                : "right-3"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3v3M17 3v3M4 9h16"
              />

              <rect
                x="4"
                y="5"
                width="16"
                height="16"
                rx="2"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 13h2M14 13h2M8 17h2M14 17h2"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   SELECT FIELD
========================= */

export function SelectField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = "",
  options,
  placeholder = "Select",
}: BaseFieldProps & {
  options: Option[];
}) {
  const selectValue = resolveValue(
    value,
    defaultValue
  );

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <select
        name={name}
        value={selectValue as string}
        required={required}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-gold/40"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================
   MULTI SELECT FIELD
========================= */

export function MultiSelectField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = "",
  options,
}: BaseFieldProps & {
  options: Option[];
}) {
  const selectedValue = (
    value ??
    defaultValue ??
    []
  ) as string[];

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <select
        name={name}
        multiple
        value={selectedValue}
        required={required}
        onChange={(event) => {
          const values = Array.from(
            event.target.selectedOptions,
            (option) => option.value
          );

          onChange?.(values);
        }}
        className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-gold/40"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <p className="mt-2 text-[11px] text-white/30">
        Hold Ctrl / Cmd to select multiple
        options.
      </p>
    </div>
  );
}

/* =========================
   COMBOBOX FIELD
========================= */

export function ComboBoxField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = "",
  options,
  placeholder,
}: BaseFieldProps & {
  options: Option[];
}) {
  const inputValue = resolveValue(
    value,
    defaultValue
  );

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <input
        list={`${name}-list`}
        name={name}
        value={inputValue as string}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
      />

      <datalist id={`${name}-list`}>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </datalist>
    </div>
  );
}

/* =========================
   TEXT AREA FIELD
========================= */

export function TextAreaField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = "",
  placeholder,
  dir = "ltr",
}: BaseFieldProps & {
  dir?: "ltr" | "rtl";
}) {
  const textareaValue = resolveValue(
    value,
    defaultValue
  );

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <textarea
        name={name}
        value={textareaValue as string}
        required={required}
        placeholder={placeholder}
        dir={dir}
        rows={5}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
      />
    </div>
  );
}