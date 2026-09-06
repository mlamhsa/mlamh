export type OpportunityApplicationWindow = {
  published: boolean;
  status: string | null;
  createdAt?: string | null;
  applicationDays?: number | null;
};

export function isValidOpportunityId(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function isOpportunityAvailable(
  opportunity: Pick<OpportunityApplicationWindow, "published" | "status"> | null | undefined,
) {
  return Boolean(
    opportunity &&
      opportunity.published === true &&
      (opportunity.status === "open" || opportunity.status === "published"),
  );
}

export function getApplicationDeadline(
  createdAt: string | null | undefined,
  applicationDays: number | null | undefined,
) {
  if (!createdAt || !applicationDays || applicationDays <= 0) {
    return null;
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return null;
  }

  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + applicationDays);
  return deadline;
}

export function isApplicationWindowClosed(
  opportunity: Pick<OpportunityApplicationWindow, "createdAt" | "applicationDays">,
  now = new Date(),
) {
  const deadline = getApplicationDeadline(
    opportunity.createdAt,
    opportunity.applicationDays,
  );

  return deadline ? now > deadline : false;
}
