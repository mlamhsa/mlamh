type FieldValue = string | number | string[] | null | undefined;

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

function resolveValue(value: FieldValue, defaultValue: FieldValue) {
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
  type?: "text" | "number" | "email" | "url" | "tel" | "password";
}) {
  const inputValue = resolveValue(value, defaultValue);

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={inputValue as string | number}
        required={required}
        placeholder={placeholder}
        dir={dir}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
      />
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
  const selectValue = resolveValue(value, defaultValue);

  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <select
        name={name}
        value={selectValue as string}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-gold/40"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
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
  const selectedValue = (value ?? defaultValue ?? []) as string[];

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
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, (option) => option.value);
          onChange?.(values);
        }}
        className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-gold/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <p className="mt-2 text-[11px] text-white/30">
        Hold Ctrl / Cmd to select multiple options.
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
  const inputValue = resolveValue(value, defaultValue);

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
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
      />

      <datalist id={`${name}-list`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
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
  const textareaValue = resolveValue(value, defaultValue);

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
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
      />
    </div>
  );
}