type ApplicationCardProps = {
    label: string;
    value: number;
    highlighted?: boolean;
  };
  
  export default function ApplicationCard({
    label,
    value,
    highlighted = false,
  }: ApplicationCardProps) {
    return (
      <div
        className={`rounded-[1.5rem] border p-5 ${
          highlighted
            ? "border-gold/30 bg-gold/[0.06]"
            : "border-white/10 bg-black/20"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">
          {label}
        </p>
  
        <p className="mt-3 text-4xl font-light">
          {value}
        </p>
      </div>
    );
  }