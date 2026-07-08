type MiniSummaryProps = {
    label: string;
    value: string | number;
    highlighted?: boolean;
  };
  
  export default function MiniSummary({
    label,
    value,
    highlighted = false,
  }: MiniSummaryProps) {
    return (
      <div
        className={`rounded-[1.5rem] border p-5 ${
          highlighted
            ? "border-gold/30 bg-gold/[0.08]"
            : "border-white/10 bg-black/20"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">
          {label}
        </p>
  
        <p className="mt-3 text-3xl font-light text-white">
          {value}
        </p>
      </div>
    );
  }