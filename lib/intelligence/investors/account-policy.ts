export const APPROVED_INVESTOR_GMAIL = "mlamhco@gmail.com";

export function normalizeInvestorGmailAddress(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function assertApprovedInvestorGmail(value: string | null | undefined) {
  const email = normalizeInvestorGmailAddress(value);
  if (email !== APPROVED_INVESTOR_GMAIL) {
    throw new Error(`Investor Relations Gmail must be ${APPROVED_INVESTOR_GMAIL}.`);
  }
  return email;
}
