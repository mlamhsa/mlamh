import type { ReactNode } from "react";

export default function ExperienceCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
        {title}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">{children}</div>
    </section>
  );
}