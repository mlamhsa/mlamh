type BioFieldProps = {
  label: string;
  namePrimary: string;
  nameSecondary: string;
  valuePrimary?: string | null;
  valueSecondary?: string | null;
  defaultPrimary?: string | null;
  defaultSecondary?: string | null;
  onChangePrimary?: (value: string) => void;
  onChangeSecondary?: (value: string) => void;
  isArabic: boolean;
};

export function BioField({
  label,
  namePrimary,
  nameSecondary,
  valuePrimary,
  valueSecondary,
  defaultPrimary,
  defaultSecondary,
  onChangePrimary,
  onChangeSecondary,
  isArabic,
}: BioFieldProps) {
  const primaryValue = valuePrimary ?? defaultPrimary ?? "";
  const secondaryValue = valueSecondary ?? defaultSecondary ?? "";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {isArabic ? (
        <>
          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
              {label}
            </label>

            <textarea
              name={namePrimary}
              value={primaryValue}
              dir="rtl"
              rows={5}
              onChange={(event) => onChangePrimary?.(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
            />
          </div>

          <input type="hidden" name={nameSecondary} value={secondaryValue} />
        </>
      ) : (
        <>
          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
              {label} EN
            </label>

            <textarea
              name={namePrimary}
              value={primaryValue}
              rows={5}
              onChange={(event) => onChangePrimary?.(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
              {label} AR
            </label>

            <textarea
              name={nameSecondary}
              value={secondaryValue}
              dir="rtl"
              rows={5}
              onChange={(event) => onChangeSecondary?.(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/40"
            />
          </div>
        </>
      )}
    </div>
  );
}