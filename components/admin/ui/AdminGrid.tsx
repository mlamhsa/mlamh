export function AdminGrid({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return <section className={`grid gap-5 ${className}`}>{children}</section>;
  }