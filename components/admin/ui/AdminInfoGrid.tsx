export function AdminInfoGrid({
    children,
    columns = 4,
  }: {
    children: React.ReactNode;
    columns?: 2 | 3 | 4;
  }) {
    const gridClass =
      columns === 2
        ? "md:grid-cols-2"
        : columns === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4";
  
    return (
      <div
        className={`mt-6 grid gap-4 rounded-2xl border border-white/[0.06] bg-black/10 p-5 text-sm ${gridClass}`}
      >
        {children}
      </div>
    );
  }