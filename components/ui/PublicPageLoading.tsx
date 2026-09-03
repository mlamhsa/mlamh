import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export function PublicPageLoading({
  variant = "cards",
}: {
  variant?: "cards" | "form" | "profile";
}) {
  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24 text-white sm:px-6 lg:pt-32">
      <section className="mx-auto w-full max-w-7xl" aria-busy="true" aria-label="جاري تحميل الصفحة">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-10">
          <Skeleton className="h-4 w-32" rounded="full" />
          <Skeleton className="mt-7 h-12 w-full max-w-2xl" rounded="xl" />
          <Skeleton className="mt-4 h-4 w-full max-w-3xl" />
          <Skeleton className="mt-3 h-4 w-4/5 max-w-2xl" />
        </div>

        {variant === "form" ? (
          <div className="mt-6 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:grid-cols-2">
            <Skeleton className="h-14 w-full" rounded="xl" />
            <Skeleton className="h-14 w-full" rounded="xl" />
            <Skeleton className="h-36 w-full lg:col-span-2" rounded="xl" />
            <Skeleton className="h-12 w-44" rounded="full" />
          </div>
        ) : variant === "profile" ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Skeleton className="h-[28rem] w-full" rounded="xl" />
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <Skeleton className="h-8 w-2/3" rounded="xl" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Skeleton className="h-24" rounded="xl" />
                <Skeleton className="h-24" rounded="xl" />
                <Skeleton className="h-24" rounded="xl" />
                <Skeleton className="h-24" rounded="xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
              <Skeleton className="h-13 w-full" rounded="xl" />
              <Skeleton className="h-13 w-full" rounded="xl" />
              <Skeleton className="h-13 w-full" rounded="xl" />
              <Skeleton className="h-13 w-full" rounded="xl" />
              <Skeleton className="h-13 w-28" rounded="xl" />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton className="hidden md:block" />
              <CardSkeleton className="hidden xl:block" />
              <CardSkeleton className="hidden xl:block" />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
