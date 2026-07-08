export function AdminPageContainer({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10 text-white">
        {children}
      </main>
    );
  }