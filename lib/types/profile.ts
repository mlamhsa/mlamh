export type AccountType = "talent" | "publisher";

export type Profile = {
  id: number;
  user_id: string;

  account_type: AccountType;

  display_name?: string | null;
  phone?: string | null;

  status: string;

  created_at: string;
  updated_at: string;
};