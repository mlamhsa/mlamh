type PillProps = {
    label: string;
    gold?: boolean;
  };
  
  export default function Pill({
    label,
    gold = false,
  }: PillProps) {
    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs ${
          gold
            ? "border-gold/30 bg-gold/10 text-gold"
            : "border-white/10 bg-white/[0.04] text-white/55"
        }`}
      >
        {label}
      </span>
    );
  }