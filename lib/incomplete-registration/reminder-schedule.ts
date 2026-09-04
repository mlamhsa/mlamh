export const INCOMPLETE_REGISTRATION_REMINDER_SCHEDULE = [
  {
    reminderNumber: 1,
    afterHours: 24,
  },
  {
    reminderNumber: 2,
    afterHours: 72,
  },
  {
    reminderNumber: 3,
    afterHours: 168,
  },
] as const;

export type IncompleteRegistrationReminderStep =
  (typeof INCOMPLETE_REGISTRATION_REMINDER_SCHEDULE)[number];

type GetNextReminderInput = {
  registrationCreatedAt: string;
  sentReminderCount: number;
  now?: Date;
};

export function getNextIncompleteRegistrationReminder({
  registrationCreatedAt,
  sentReminderCount,
  now = new Date(),
}: GetNextReminderInput):
  | {
      due: true;
      reminderNumber: number;
      scheduledAt: Date;
    }
  | {
      due: false;
      reason:
        | "invalid_registration_date"
        | "schedule_completed"
        | "not_due_yet";
      scheduledAt?: Date;
    } {
  const registrationDate = new Date(registrationCreatedAt);

  if (Number.isNaN(registrationDate.getTime())) {
    return {
      due: false,
      reason: "invalid_registration_date",
    };
  }

  const nextStep = INCOMPLETE_REGISTRATION_REMINDER_SCHEDULE[sentReminderCount];

  if (!nextStep) {
    return {
      due: false,
      reason: "schedule_completed",
    };
  }

  const scheduledAt = new Date(
    registrationDate.getTime() +
      nextStep.afterHours * 60 * 60 * 1000,
  );

  if (now.getTime() < scheduledAt.getTime()) {
    return {
      due: false,
      reason: "not_due_yet",
      scheduledAt,
    };
  }

  return {
    due: true,
    reminderNumber: nextStep.reminderNumber,
    scheduledAt,
  };
}
