export function AdminEmptyState({
  message = "No results found.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center">
      <h3 className="text-lg font-light text-white">{message}</h3>
    </div>
  );
}