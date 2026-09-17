const INVALID_JSON_ERROR = "Investor research returned invalid JSON.";

export async function withInvestorResearchRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes(INVALID_JSON_ERROR)) throw error;
  }

  return operation();
}
