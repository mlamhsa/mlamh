import type { TalentSubmissionErrors } from "@/lib/validations/talent-submission";

export type SubmitTalentState = {
  success: boolean;
  message?: string;
 errors?: TalentSubmissionErrors;
};

export const initialSubmitTalentState: SubmitTalentState = {
  success: false,
  message: undefined,
  errors: {},
};