type TextFieldProps = {
    label: string;
    name: string;
    defaultValue?: string | number | null;
    dir?: "ltr" | "rtl";
    required?: boolean;
    type?: string;
    placeholder?: string;
  };
  
  export function TextField({
    label,
    name,
    defaultValue,
    dir = "ltr",
    required = false,
    type = "text",
    placeholder,
  }: TextFieldProps) {
    return (
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
          {label}
        </label>
  
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          dir={dir}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
        />
      </div>
    );
  }