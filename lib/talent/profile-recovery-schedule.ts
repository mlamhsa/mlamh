export const TALENT_PROFILE_RECOVERY_SCHEDULE = [
  { reminderNumber: 1, afterHours: 24 },
  { reminderNumber: 2, afterHours: 72 },
  { reminderNumber: 3, afterHours: 168 },
] as const;

export function getNextTalentProfileRecoveryReminder({
  anchorCreatedAt,
  sentReminderCount,
  now = new Date(),
}: {
  anchorCreatedAt: string;
  sentReminderCount: number;
  now?: Date;
}):
  | {
      due: true;
      reminderNumber: number;
      scheduledAt: Date;
    }
  | {
      due: false;
      reason:
        | "invalid_anchor_date"
        | "schedule_completed"
        | "not_due_yet";
      scheduledAt?: Date;
    } {
  const anchorDate = new Date(anchorCreatedAt);

  if (Number.isNaN(anchorDate.getTime())) {
    return {
      due: false,
      reason: "invalid_anchor_date",
    };
  }

  const nextStep =
    TALENT_PROFILE_RECOVERY_SCHEDULE[sentReminderCount];

  if (!nextStep) {
    return {
      due: false,
      reason: "schedule_completed",
    };
  }

  const scheduledAt = new Date(
    anchorDate.getTime() +
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
