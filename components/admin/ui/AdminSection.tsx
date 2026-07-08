export function AdminSection({
    title,
    description,
    children,
  }: {
    title?: string;
    description?: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mt-10">
        {title || description ? (
          <div className="mb-6">
            {title ? (
              <h2 className="text-lg font-medium text-white">{title}</h2>
            ) : null}
  
            {description ? (
              <p className="mt-1 text-sm text-gray-muted">{description}</p>
            ) : null}
          </div>
        ) : null}
  
        {children}
      </section>
    );
  }