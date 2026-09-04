export const TALENT_PROFILE_RECOVERY_SCHEDULE = [
  { reminderNumber: 1, afterHours: 24, minHoursSincePrevious: 0 },
  { reminderNumber: 2, afterHours: 72, minHoursSincePrevious: 48 },
  { reminderNumber: 3, afterHours: 168, minHoursSincePrevious: 96 },
] as const;

export function getNextTalentProfileRecoveryReminder({
  anchorCreatedAt,
  sentReminderCount,
  lastReminderSentAt,
  now = new Date(),
}: {
  anchorCreatedAt: string;
  sentReminderCount: number;
  lastReminderSentAt?: string | null;
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
        | "invalid_last_reminder_date"
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

  const anchorScheduleAt = new Date(
    anchorDate.getTime() +
      nextStep.afterHours * 60 * 60 * 1000,
  );

  let scheduledAt = anchorScheduleAt;

  if (sentReminderCount > 0) {
    if (!lastReminderSentAt) {
      return {
        due: false,
        reason: "invalid_last_reminder_date",
      };
    }

    const lastReminderDate = new Date(lastReminderSentAt);

    if (Number.isNaN(lastReminderDate.getTime())) {
      return {
        due: false,
        reason: "invalid_last_reminder_date",
      };
    }

    const spacedScheduleAt = new Date(
      lastReminderDate.getTime() +
        nextStep.minHoursSincePrevious * 60 * 60 * 1000,
    );

    if (spacedScheduleAt.getTime() > scheduledAt.getTime()) {
      scheduledAt = spacedScheduleAt;
    }
  }

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
