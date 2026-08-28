export type TapChargeStatus =
  | "INITIATED"
  | "ABANDONED"
  | "CANCELLED"
  | "FAILED"
  | "DECLINED"
  | "RESTRICTED"
  | "CAPTURED"
  | "VOID"
  | "TIMEDOUT"
  | "UNKNOWN"
  | string;

export type TapCharge = {
  id: string;
  object?: string;
  status: TapChargeStatus;
  amount: number;
  currency: string;
  transaction?: {
    url?: string | null;
  } | null;
  reference?: {
    order?: string | null;
    transaction?: string | null;
    idempotent?: string | null;
  } | null;
};

export type TapCreateChargeResponse = TapCharge;

export type TapRefund = {
  id: string;
  object?: string;
  status: string;
  amount: number;
  currency: string;
  charge?: string | null;
};
