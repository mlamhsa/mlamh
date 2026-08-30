export function AdminPageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-7 text-white sm:px-6 sm:py-10">
      {children}
    </main>
  );
}
