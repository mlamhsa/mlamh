export function AdminInfoItem({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
          {label}
        </p>
  
        <p className="mt-1 truncate text-white/80">{value || "—"}</p>
      </div>
    );
  }