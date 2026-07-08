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
      <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            {eyebrow}
          </p>
  
          <h1
            className="mt-3 text-3xl font-light tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {title}
          </h1>
  
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-muted">
              {description}
            </p>
          ) : null}
        </div>
  
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </section>
    );
  }