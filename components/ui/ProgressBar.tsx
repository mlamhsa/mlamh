type ProgressBarProps = {
    value: number; // 0 - 100
    showLabel?: boolean;
  };
  
  export function ProgressBar({
    value,
    showLabel = true,
  }: ProgressBarProps) {
    const safeValue = Math.max(0, Math.min(100, value));
  
    return (
      <div className="w-full">
        {showLabel && (
          <div className="mb-2 flex justify-between text-xs text-white/40">
            <span>Progress</span>
            <span className="text-gold">{safeValue}%</span>
          </div>
        )}
  
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${safeValue}%` }}
          />
        </div>
      </div>
    );
  }