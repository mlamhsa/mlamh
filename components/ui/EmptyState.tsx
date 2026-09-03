import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  children?: ReactNode;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EmptyState({
  eyebrow = "لا توجد بيانات بعد",
  title,
  description,
  action,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  children,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-[2rem] border border-dashed border-white/12 bg-white/[0.045] p-6 text-center shadow-2xl shadow-black/25 sm:p-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D4A017]/50 to-transparent" />
      <div className="mx-auto flex min-h-14 w-14 items-center justify-center rounded-2xl border border-[#D4A017]/20 bg-[#D4A017]/10 text-lg font-semibold text-[#D4A017]">
        ML
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#D4A017]/80">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/62">{description}</p> : null}

      {action ? <div className="mt-7">{action}</div> : null}

      {(actionLabel && actionHref) || (secondaryActionLabel && secondaryActionHref) ? (
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D4A017] px-5 text-sm font-semibold text-black transition hover:bg-[#e0b23a]"
            >
              {actionLabel}
            </Link>
          ) : null}
          {secondaryActionLabel && secondaryActionHref ? (
            <Link
              href={secondaryActionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 px-5 text-sm font-semibold text-white/82 transition hover:bg-white/8"
            >
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}
