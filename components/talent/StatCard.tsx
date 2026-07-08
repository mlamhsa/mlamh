type StatCardProps = {
    label: string;
    value: string | number;
    highlighted?: boolean;
  };
  
  export default function StatCard({
    label,
    value,
    highlighted = false,
  }: StatCardProps) {
    return (
      <div
        className={`rounded-[1.75rem] border p-5 ${
          highlighted
            ? "border-gold/20 bg-gold/[0.04]"
            : "border-white/10 bg-white/[0.025]"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">
          {label}
        </p>
  
        <p className="mt-3 text-2xl font-light text-white">
          {value}
        </p>
      </div>
    );
  }