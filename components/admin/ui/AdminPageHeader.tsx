export function AdminPageHeader({
  eyebrow = "MLAMH ADMIN",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-5 border-b border-white/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-gold/85">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-white/38 sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
