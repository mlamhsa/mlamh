import { Skeleton } from "./Skeleton";

function MetricCardSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-3 w-24" rounded="full" />
        <Skeleton className="h-10 w-10" rounded="xl" />
      </div>
      <Skeleton className="mt-7 h-8 w-24" rounded="lg" />
      <Skeleton className="mt-3 h-3 w-36" rounded="full" />
    </div>
  );
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
      <Skeleton className="h-11 w-11" rounded="full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" rounded="full" />
        <Skeleton className="h-3 w-1/2" rounded="full" />
      </div>
      <Skeleton className="hidden h-8 w-20 sm:block" rounded="full" />
    </div>
  );
}

export function DashboardLoading({
  title = "جاري تجهيز لوحة التحكم",
  subtitle = "نحمّل البيانات المهمة ونجهّز مساحة العمل.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-white sm:px-6 lg:px-8" aria-busy="true">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-6 sm:p-8">
          <Skeleton className="h-3 w-28" rounded="full" />
          <h1 className="mt-4 text-2xl font-light sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">{subtitle}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-12" rounded="xl" />
            <Skeleton className="h-12" rounded="xl" />
            <Skeleton className="h-12" rounded="xl" />
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" rounded="full" />
                <Skeleton className="h-3 w-52" rounded="full" />
              </div>
              <Skeleton className="h-10 w-24" rounded="full" />
            </div>
            <div className="mt-5 space-y-3">
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
            <Skeleton className="h-4 w-40" rounded="full" />
            <Skeleton className="mt-3 h-3 w-64 max-w-full" rounded="full" />
            <div className="mt-6 space-y-4">
              <Skeleton className="h-28" rounded="xl" />
              <Skeleton className="h-28" rounded="xl" />
              <Skeleton className="h-28" rounded="xl" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
