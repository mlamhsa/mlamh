"use client";

import { useState } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectFieldProps = {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string[] | string | null;
};

function parseInitialValue(value?: string[] | string | null) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function MultiSelectField({
  name,
  label,
  options,
  defaultValue,
}: MultiSelectFieldProps) {
  const [selected, setSelected] = useState<string[]>(
    parseInitialValue(defaultValue)
  );

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  return (
    <div className="md:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selected.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition ${
                  active
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}