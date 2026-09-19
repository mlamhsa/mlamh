export function AdminPageContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1540px] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-9 ${className}`}
    >
      {children}
    </div>
  );
}
