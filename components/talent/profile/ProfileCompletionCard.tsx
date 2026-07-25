type ProfileCompletionCardProps = {
  label: string;
  value: number;
  className?: string;
  showPercentage?: boolean;
};

export default function ProfileCompletionCard({
  label,
  value,
  className = "",
  showPercentage = true,
}: ProfileCompletionCardProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.025] p-5 shadow-sm ${className}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-4">
        <span className="arabic-safe min-w-0 text-[10px] uppercase tracking-[0.22em] text-gray-muted sm:text-[11px] sm:tracking-[0.26em]">
          {label}
        </span>

        {showPercentage ? (
          <span className="shrink-0 text-base font-medium tabular-nums text-gold">
            {percentage}%
          </span>
        ) : null}
      </div>

      <div
        className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}