import { NextRequest, NextResponse } from "next/server";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import { sendIncompleteRegistrationReminder } from "@/lib/incomplete-registration/send-reminder";

import { getNextIncompleteRegistrationReminder } from "@/lib/incomplete-registration/reminder-schedule";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "[IncompleteRegistrationCron] CRON_SECRET is not configured",
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Cron configuration is incomplete.",
      },
      {
        status: 500,
      },
    );
  }

  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: authUsersData,
    error: authUsersError,
  } =
    await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (authUsersError) {
    console.error(
      "[IncompleteRegistrationCron.authUsers]",
      authUsersError,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load auth users.",
      },
      {
        status: 500,
      },
    );
  }

  const authUsers =
    authUsersData.users ?? [];

  if (authUsers.length === 0) {
    return NextResponse.json({
      success: true,
      checked: 0,
      sent: 0,
      skipped: 0,
    });
  }

  const userIds =
    authUsers.map(
      (user) => user.id,
    );

  const {
    data: profileRows,
    error: profilesError,
  } = await adminClient
    .from("profiles")
    .select("user_id")
    .in("user_id", userIds);

  if (profilesError) {
    console.error(
      "[IncompleteRegistrationCron.profiles]",
      profilesError,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load profiles.",
      },
      {
        status: 500,
      },
    );
  }

  const profileUserIds =
    new Set(
      (profileRows ?? []).map(
        (profile) =>
          String(
            profile.user_id ?? "",
          ),
      ),
    );

  const incompleteUsers =
    authUsers.filter(
      (user) =>
        !profileUserIds.has(
          user.id,
        ),
    );

  if (
    incompleteUsers.length === 0
  ) {
    return NextResponse.json({
      success: true,
      checked: authUsers.length,
      incomplete: 0,
      sent: 0,
      skipped: 0,
    });
  }

  const incompleteUserIds =
    incompleteUsers.map(
      (user) => user.id,
    );

  const {
    data: reminderEvents,
    error: reminderEventsError,
  } = await adminClient
    .from("events")
    .select(
      "target_id, created_at",
    )
    .eq(
      "event_type",
      EVENT_TYPES
        .incomplete_registration_reminder_sent,
    )
    .eq(
      "target_type",
      EVENT_TARGETS.AUTH_USER,
    )
    .in(
      "target_id",
      incompleteUserIds,
    );

  if (reminderEventsError) {
    console.error(
      "[IncompleteRegistrationCron.events]",
      reminderEventsError,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load reminder history.",
      },
      {
        status: 500,
      },
    );
  }

  const reminderCountByUser =
    new Map<string, number>();

  for (
    const event of
    reminderEvents ?? []
  ) {
    const targetId =
      String(
        event.target_id ?? "",
      ).trim();

    if (!targetId) {
      continue;
    }

    reminderCountByUser.set(
      targetId,
      (
        reminderCountByUser.get(
          targetId,
        ) ?? 0
      ) + 1,
    );
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (
    const user of
    incompleteUsers
  ) {
    if (!user.created_at) {
      skipped += 1;
      continue;
    }

    const sentReminderCount =
      reminderCountByUser.get(
        user.id,
      ) ?? 0;

    const nextReminder =
      getNextIncompleteRegistrationReminder({
        registrationCreatedAt:
          user.created_at,
        sentReminderCount,
      });

    if (!nextReminder.due) {
      skipped += 1;
      continue;
    }

    /*
     * sendIncompleteRegistrationReminder
     * يعيد فحص profiles مرة أخرى
     * مباشرة قبل إرسال البريد.
     *
     * لذلك حتى لو أكمل المستخدم التسجيل
     * أثناء تشغيل الـCron لن تصله الرسالة.
     */
    const result =
      await sendIncompleteRegistrationReminder({
        userId: user.id,
        locale: "ar",
      });

    if (!result.success) {
      if (
        result.status ===
        "registration_completed"
      ) {
        skipped += 1;
        continue;
      }

      failed += 1;

      console.error(
        "[IncompleteRegistrationCron.send]",
        {
          userId: user.id,
          status:
            result.status,
          message:
            result.message,
        },
      );

      continue;
    }

    try {
      await createEvent({
        type:
          EVENT_TYPES
            .incomplete_registration_reminder_sent,
        target:
          EVENT_TARGETS.AUTH_USER,
        targetId:
          user.id,

        /*
         * لا يوجد Admin ضغط الزر.
         * لذلك لا ننسب التذكير الآلي
         * إلى مستخدم إداري.
         */
        actorId: null,

        metadata: {
          locale: "ar",
          email:
            result.email,
          provider:
            result.provider,
          registration_created_at:
            result.registrationCreatedAt,
          reminder_channel:
            "email",
          reminder_reason:
            "incomplete_registration",
          reminder_source:
            "system",
          reminder_number:
            nextReminder.reminderNumber,
          scheduled_at:
            nextReminder.scheduledAt.toISOString(),
        },
      });

      sent += 1;
    } catch (eventError) {
      /*
       * البريد تم إرساله بالفعل.
       * لذلك نسجل الخطأ بوضوح.
       *
       * مهم:
       * لو فشل تسجيل Event،
       * قد يحاول النظام الإرسال مرة أخرى
       * في التشغيل القادم.
       */
      failed += 1;

      console.error(
        "[IncompleteRegistrationCron.event]",
        {
          userId: user.id,
          eventError,
        },
      );
    }
  }

  return NextResponse.json({
    success: true,
    checked:
      authUsers.length,
    incomplete:
      incompleteUsers.length,
    sent,
    skipped,
    failed,
  });
}