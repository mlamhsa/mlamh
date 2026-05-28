type TalentEmptyStateProps = {
    title: string;
    description?: string;
  };
  
  export function TalentEmptyState({
    title,
    description,
  }: TalentEmptyStateProps) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/20 px-8 py-20 text-center">
        <p className="text-2xl font-light text-white">
          {title}
        </p>
  
        {description ? (
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-muted">
            {description}
          </p>
        ) : null}
      </div>
    );
  }