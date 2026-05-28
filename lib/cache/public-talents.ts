import { cache } from "react";

export const getCachedValue = cache(
  async <T>(key: string, fn: () => Promise<T>) => {
    return await fn();
  }
);