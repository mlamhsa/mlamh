"use client";

import type {
  ChangeEvent,
  InputHTMLAttributes,
} from "react";
import { Search, X } from "lucide-react";

type MobileSearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  containerClassName?: string;
};

function mergeClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function MobileSearchField({
  value,
  onChange,
  onClear,
  loading = false,
  disabled,
  className,
  containerClassName,
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: MobileSearchFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  function handleClear() {
    if (disabled) {
      return;
    }

    if (onClear) {
      onClear();
      return;
    }

    onChange("");
  }

  const hasValue = value.length > 0;

  return (
    <div
      className={mergeClasses(
        "relative flex min-h-12 w-full items-center rounded-2xl border border-white/10 bg-white/[0.045]",
        "focus-within:border-gold/40 focus-within:bg-white/[0.06]",
        disabled && "cursor-not-allowed opacity-50",
        containerClassName
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute start-4 flex items-center text-white/40"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Search size={20} strokeWidth={1.8} />
        )}
      </span>

      <input
        type="search"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder ?? "Search"}
        className={mergeClasses(
          "h-12 w-full bg-transparent px-12 text-base text-white outline-none",
          "placeholder:text-white/35",
          "[&::-webkit-search-cancel-button]:hidden",
          className
        )}
        {...props}
      />

      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear search"
          className="absolute end-2 flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:pointer-events-none"
        >
          <X size={18} strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );
}