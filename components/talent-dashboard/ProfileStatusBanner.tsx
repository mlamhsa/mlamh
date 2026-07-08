"use client";

type Props = {
  percentage: number;
  missing?: string[];
};

export default function ProfileStatusBanner({
  percentage,
  missing = [],
}: Props) {
  const isComplete = percentage === 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white">
          {isComplete ? "🟢 ملفك مكتمل" : "🟡 ملفك يحتاج إكمال"}
        </p>

        <p className="text-gold text-sm">{percentage}%</p>
      </div>

      {/* PROGRESS BAR */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gold transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* MISSING INFO */}
      {missing.length > 0 && (
        <div className="mt-3 text-xs text-gray-muted">
          تحتاج: {missing.join(" • ")}
        </div>
      )}
    </div>
  );
}