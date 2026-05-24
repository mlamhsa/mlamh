export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div lang="en" dir="ltr" className="relative z-[2] min-h-screen bg-background">
      {children}
    </div>
  );
}
