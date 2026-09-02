export function AdminSection({ title, description, children }: { title?: string; description?: string; children: React.ReactNode; }) {
  return (
    <section className="mt-10 scroll-mt-24">
      {title || description ? (
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-white/95">{title}</h2> : null}
            {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-white/38">{description}</p> : null}
          </div>
          <span className="hidden h-px w-16 shrink-0 bg-gradient-to-r from-gold/50 to-transparent sm:block" />
        </div>
      ) : null}
      {children}
    </section>
  );
}
