import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function ProfileHero({
  eyebrow,
  title,
  description,
  actions,
  children,
}: Props) {
  return (
    <header className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-8 md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {eyebrow}
          </p>

          <h1 className="mt-4 text-4xl font-light leading-tight text-white md:text-6xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
              {description}
            </p>
          ) : null}

          {children}
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>
    </header>
  );
}