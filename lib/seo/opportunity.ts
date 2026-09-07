export type OpportunitySeoRecord = {
  id: number | string;
  status?: string | null;
  application_deadline?: string | null;
  deadline?: string | null;
  expires_at?: string | null;
};

export function getOpportunityDeadline(record: OpportunitySeoRecord) {
  return record.application_deadline?.trim()
    || record.deadline?.trim()
    || record.expires_at?.trim()
    || null;
}

function deadlineTimestamp(value: string | null) {
  if (!value) return null;
  const compact = value.slice(0, 10);
  const timestamp = Date.parse(`${compact}T23:59:59`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isOpportunityOpenForSeo(record: OpportunitySeoRecord, now = new Date()) {
  if (!["published", "open"].includes(record.status ?? "")) return false;
  const deadline = deadlineTimestamp(getOpportunityDeadline(record));
  return deadline === null || deadline >= now.getTime();
}
