import { unstable_cache } from "next/cache";

const PUBLIC_TALENT_REVALIDATE_SECONDS = 30;

export async function getCachedValue<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const getValue = unstable_cache(
    fn,
    ["public-talents", key],
    {
      revalidate: PUBLIC_TALENT_REVALIDATE_SECONDS,
      tags: ["public-talents"],
    },
  );

  return getValue();
}
