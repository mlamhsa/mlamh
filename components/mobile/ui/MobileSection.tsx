import type { ReactNode } from "react";

type MobileSectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};

function mergeClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function MobileSection({
  children,
  title,
  description,
  action,
  className,
  contentClassName,
}: MobileSectionProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section
      className={mergeClasses(
        "w-full py-4 lg:py-6",
        className
      )}
    >
      {hasHeader ? (
        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold leading-tight text-white sm:text-lg">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="mt-1 text-sm leading-6 text-white/55">
                {description}
              </p>
            ) : null}
          </div>

          {action ? (
            <div className="shrink-0">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={mergeClasses("w-full", contentClassName)}>
        {children}
      </div>
    </section>
  );
}