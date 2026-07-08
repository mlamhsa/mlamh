import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-3 text-4xl font-light text-white">{title}</h1>

        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}