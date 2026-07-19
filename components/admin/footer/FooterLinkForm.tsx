type FooterLink = {
    id?: number;
    section: string;
    label_ar: string;
    label_en: string;
    href: string;
    sort_order: number;
    is_active: boolean;
    open_in_new_tab: boolean;
  };
  
  type FooterLinkFormProps = {
    defaultValues?: Partial<FooterLink>;
    submitLabel: string;
    action: (formData: FormData) => Promise<void>;
  };
  
  export function FooterLinkForm({
    defaultValues,
    submitLabel,
    action,
  }: FooterLinkFormProps) {
    return (
      <form action={action} className="grid gap-5">
        {defaultValues?.id ? (
          <input
            type="hidden"
            name="id"
            value={defaultValues.id}
          />
        ) : null}
  
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Section"
            name="section"
            defaultValue={defaultValues?.section}
          />
  
          <Input
            label="Sort Order"
            name="sort_order"
            type="number"
            defaultValue={
              defaultValues?.sort_order?.toString() ?? "0"
            }
          />
        </div>
  
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Arabic Label"
            name="label_ar"
            defaultValue={defaultValues?.label_ar}
          />
  
          <Input
            label="English Label"
            name="label_en"
            defaultValue={defaultValues?.label_en}
          />
        </div>
  
        <Input
          label="URL"
          name="href"
          defaultValue={defaultValues?.href}
        />
  
        <div className="flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={defaultValues?.is_active ?? true}
            />
  
            Active
          </label>
  
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              name="open_in_new_tab"
              defaultChecked={
                defaultValues?.open_in_new_tab ?? false
              }
            />
  
            Open In New Tab
          </label>
        </div>
  
        <button
          type="submit"
          className="w-fit rounded-full border border-gold/40 px-6 py-3 text-xs uppercase tracking-[0.25em] text-gold transition hover:bg-gold hover:text-black"
        >
          {submitLabel}
        </button>
      </form>
    );
  }
  
  function Input({
    label,
    name,
    defaultValue,
    type = "text",
  }: {
    label: string;
    name: string;
    defaultValue?: string;
    type?: string;
  }) {
    return (
      <div>
        <label className="text-xs text-white/50">
          {label}
        </label>
  
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
        />
      </div>
    );
  }