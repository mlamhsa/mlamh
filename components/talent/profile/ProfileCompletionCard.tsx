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
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
          {label}
        </span>

        {showPercentage && (
          <span className="text-sm font-medium text-gold">
            {percentage}%
          </span>
        )}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}