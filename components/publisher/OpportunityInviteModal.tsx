"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  sendOpportunityInvitationsAction,
  type SendOpportunityInvitationsState,
} from "@/lib/actions/send-opportunity-invitations";
import type { PublisherInviteOpportunity } from "@/lib/supabase/opportunities";

type Props = {
  locale: "ar" | "en";
  talentId: number;
  opportunities: PublisherInviteOpportunity[];
  invitedOpportunityIds: number[];
};

const initialState: SendOpportunityInvitationsState = {
  success: false,
  message: null,
  sentCount: 0,
};

export function OpportunityInviteModal({
  locale,
  talentId,
  opportunities,
  invitedOpportunityIds,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [locallyInvitedIds, setLocallyInvitedIds] =
    useState<number[]>(invitedOpportunityIds);

  const [state, formAction, isPending] = useActionState(
    sendOpportunityInvitationsAction,
    initialState,
  );

  const isArabic = locale === "ar";

  const invitedIds = useMemo(
    () => new Set(locallyInvitedIds),
    [locallyInvitedIds],
  );

  const availableOpportunities = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          !invitedIds.has(opportunity.id),
      ),
    [opportunities, invitedIds],
  );

  const allSelected =
    availableOpportunities.length > 0 &&
    selected.length === availableOpportunities.length;

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (state.sentCount > 0 && selected.length > 0) {
      setLocallyInvitedIds((current) =>
        Array.from(
          new Set([...current, ...selected]),
        ),
      );
    }

    setSelected([]);
  }, [state.success, state.sentCount]);

  function toggleOpportunity(opportunityId: number) {
    if (
      invitedIds.has(opportunityId) ||
      isPending
    ) {
      return;
    }

    setSelected((current) =>
      current.includes(opportunityId)
        ? current.filter(
            (selectedId) =>
              selectedId !== opportunityId,
          )
        : [...current, opportunityId],
    );
  }

  function toggleAll() {
    if (isPending) {
      return;
    }

    if (allSelected) {
      setSelected([]);
      return;
    }

    setSelected(
      availableOpportunities.map(
        (opportunity) => opportunity.id,
      ),
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="locale"
        value={locale}
      />

      <input
        type="hidden"
        name="talent_id"
        value={talentId}
      />

      <div>
        <h3 className="text-xl font-semibold text-white">
          {isArabic
            ? "دعوة إلى الفرص"
            : "Invite to Opportunities"}
        </h3>

        <p className="mt-2 text-sm leading-7 text-white/50">
          {isArabic
            ? "اختر فرصة واحدة أو أكثر لإرسال دعوة مباشرة إلى الموهبة."
            : "Select one or more opportunities to invite the talent directly."}
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/50">
          {isArabic
            ? "ليس لديك فرص منشورة حاليًا. انشر فرصة أولًا لتتمكن من دعوة المواهب."
            : "You don't have any published opportunities. Publish an opportunity first to invite talents."}
        </div>
      ) : (
        <>
          {availableOpportunities.length > 0 ? (
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 transition hover:border-gold/25 hover:bg-white/[0.03]">
              <span className="text-sm font-medium text-white/80">
                {isArabic
                  ? "تحديد جميع الفرص المتاحة"
                  : "Select all available opportunities"}
              </span>

              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={isPending}
                className="size-5 cursor-pointer accent-gold disabled:cursor-not-allowed"
              />
            </label>
          ) : (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-sm leading-7 text-emerald-300">
              {isArabic
                ? "تمت دعوة هذه الموهبة إلى جميع فرصك المنشورة."
                : "This talent has already been invited to all your published opportunities."}
            </div>
          )}

          <div className="space-y-3">
            {opportunities.map((opportunity) => {
              const alreadyInvited = invitedIds.has(
                opportunity.id,
              );

              const isSelected = selected.includes(
                opportunity.id,
              );

              const city = isArabic
                ? opportunity.city_ar
                : opportunity.city_en;

              return (
                <label
                  key={opportunity.id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition duration-200 ${
                    alreadyInvited
                      ? "cursor-not-allowed border-emerald-400/20 bg-emerald-400/[0.05] opacity-75"
                      : isSelected
                        ? "cursor-pointer border-gold/45 bg-gold/[0.07]"
                        : "cursor-pointer border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="opportunity_ids"
                    value={opportunity.id}
                    checked={isSelected}
                    onChange={() =>
                      toggleOpportunity(
                        opportunity.id,
                      )
                    }
                    disabled={
                      isPending ||
                      alreadyInvited
                    }
                    className="mt-1 size-5 shrink-0 cursor-pointer accent-gold disabled:cursor-not-allowed"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-base font-medium leading-7 text-white">
                        {opportunity.title}
                      </p>

                      {alreadyInvited ? (
                        <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                          {isArabic
                            ? "تمت الدعوة"
                            : "Invited"}
                        </span>
                      ) : null}
                    </div>

                    {city ? (
                      <p className="mt-1 text-sm text-white/45">
                        {city}
                      </p>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>

          {state.message ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                state.success
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/25 bg-red-400/10 text-red-300"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          {availableOpportunities.length > 0 ? (
            <div className="border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={
                  selected.length === 0 ||
                  isPending
                }
                className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-black/20 transition duration-300 hover:bg-gold-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
              >
                {isPending
                  ? isArabic
                    ? "جارٍ إرسال الدعوات..."
                    : "Sending invitations..."
                  : isArabic
                    ? selected.length > 0
                      ? `إرسال الدعوات (${selected.length})`
                      : "اختر الفرص أولًا"
                    : selected.length > 0
                      ? `Send invitations (${selected.length})`
                      : "Select opportunities first"}
              </button>

              <p className="mt-3 text-center text-xs leading-6 text-white/35">
                {isArabic
                  ? "سيصل للموهبة إشعار منفصل عن كل فرصة مختارة."
                  : "The talent will receive a separate notification for each selected opportunity."}
              </p>
            </div>
          ) : null}
        </>
      )}
    </form>
  );
}