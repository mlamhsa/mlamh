import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
};

const roundedClasses: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-2xl",
  full: "rounded-full",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Skeleton({ className, rounded = "lg", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("mlamh-skeleton bg-white/[0.07]", roundedClasses[rounded], className)}
      {...props}
    />
  );
}

export function CardSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20",
        className,
      )}
      {...props}
    >
      <Skeleton className="h-40 w-full" rounded="xl" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="جاري تحميل القائمة">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        >
          <Skeleton className="h-12 w-12" rounded="full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-8 w-24 sm:block" rounded="full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12" aria-busy="true" aria-label="جاري تحميل الصفحة">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" rounded="full" />
        <Skeleton className="h-12 w-full max-w-2xl" rounded="xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </main>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]" aria-busy="true">
      <div className="grid grid-cols-4 gap-4 border-b border-white/10 p-4">
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 border-b border-white/5 p-4 last:border-0">
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
        </div>
      ))}
    </div>
  );
}
