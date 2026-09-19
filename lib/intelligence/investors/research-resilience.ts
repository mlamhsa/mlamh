import { withInvestorResearchRetry } from "./research-retry";

const TRANSIENT_PROVIDER_ERROR =
  /rate.?limit|free tier requests on this model|service temporarily unavailable|gatewayinternalservererror|temporar(?:y|ily) unavailable|overloaded|timeout|timed out|connection reset|model .* not found|no provider available/i;

export function isTransientInvestorProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return TRANSIENT_PROVIDER_ERROR.test(message);
}

export async function runInvestorResearchDegraded<T>(
  label: string,
  operation: () => Promise<T>,
): Promise<T | { degraded: true; reason: "provider_temporarily_unavailable"; label: string }> {
  try {
    return await withInvestorResearchRetry(operation);
  } catch (error) {
    if (!isTransientInvestorProviderError(error)) throw error;
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[InvestorRelations degraded]", { label, reason: message.slice(0, 300) });
    return { degraded: true, reason: "provider_temporarily_unavailable", label };
  }
}
