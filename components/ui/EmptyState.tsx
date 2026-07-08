import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center">
      <h3 className="text-2xl font-light text-white">{title}</h3>

      {description ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}