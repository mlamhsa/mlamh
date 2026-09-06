export type GrowthFunnelInput = {
  visits: number;
  registrations: number;
  applications: number;
  briefs: number;
};

export type GrowthFunnelState =
  | "insufficient_data"
  | "registration_leak"
  | "activation_leak"
  | "demand_gap"
  | "healthy";

export type GrowthFunnelSnapshot = GrowthFunnelInput & {
  registrationRate: number | null;
  applicationActivationRate: number | null;
  briefRate: number | null;
  state: GrowthFunnelState;
  deterministic: true;
};

function pct(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 100);
}

export function deriveGrowthFunnel(input: GrowthFunnelInput): GrowthFunnelSnapshot {
  const visits = Math.max(0, Math.floor(input.visits));
  const registrations = Math.max(0, Math.floor(input.registrations));
  const applications = Math.max(0, Math.floor(input.applications));
  const briefs = Math.max(0, Math.floor(input.briefs));

  const registrationRate = pct(registrations, visits);
  const applicationActivationRate = pct(applications, registrations);
  const briefRate = pct(briefs, visits);

  let state: GrowthFunnelState;
  if (visits < 50) state = "insufficient_data";
  else if ((registrationRate ?? 0) < 10) state = "registration_leak";
  else if ((applicationActivationRate ?? 0) < 25) state = "activation_leak";
  else if (briefs === 0) state = "demand_gap";
  else state = "healthy";

  return {
    visits,
    registrations,
    applications,
    briefs,
    registrationRate,
    applicationActivationRate,
    briefRate,
    state,
    deterministic: true,
  };
}
