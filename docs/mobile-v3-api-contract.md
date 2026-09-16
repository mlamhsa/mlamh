# MLAMH Mobile V3 — API Contract

Status: implementation reference for reconciling Native V3 with current `main` server behavior.

## Contract principles

1. Native screens consume product-safe contracts, not database rows.
2. Server-side business rules remain authoritative.
3. Web and Native must converge on shared services for the same product action.
4. Quick Request and Casting semantics must be explicit in API responses.
5. Raw status names such as `pending` or `accepted` must not be sufficient for Native presentation when their meaning depends on opportunity mode.
6. Protected fields must be omitted for unauthorized callers, not merely hidden in UI.
7. All market and locale inputs are validated server-side.

## Common response conventions

Authenticated failures should use stable machine-readable `code` values. Native maps these codes to localized user-facing copy.

Recommended shape:

```ts
{ ok: false, code: "SOME_CODE", details?: Record<string, unknown> }
```

Do not expose raw Supabase/Postgres errors to clients.

## Account context

### `GET /api/account/me`

Current endpoint remains canonical for session bootstrap and should be extended rather than replaced.

Recommended account payload:

```ts
type MobileAccountContext = {
  type: "talent" | "publisher";
  displayName: string | null;
  phone: string | null;
  phoneVerified: boolean;
  approvalStatus: string | null;
  status: string | null;
  onboardingStatus: string | null;
  onboardingStep: string | null;
  entityId: number | null;
  countryCode: string | null;
  publisherType?: string | null;
  publisherSubtype?: string | null;
  verificationStatus?: string | null;
  canCreate?: boolean;
  canCreateQuick?: boolean;
  canCreateCasting?: boolean;
};
```

The server should compute capabilities from current product rules. Native must not infer publisher capabilities only from visible subtype labels.

### `POST /api/account/type`

Retain for new authenticated users selecting Talent or Publisher intent.

### `DELETE /api/account/delete`

Retain as the MLAMH account deletion endpoint. Native release flow must additionally revoke Apple authorization when applicable before/while completing account deletion according to current auth implementation.

## Public opportunities

### `GET /api/opportunities`

Current market/locale validation is retained.

Public opportunity contract should add explicit product semantics:

```ts
type PublicOpportunity = {
  // existing fields
  postingMode: "quick" | "casting";
  isOpen: boolean;
};
```

If a user-specific authenticated discovery endpoint is later introduced, it may additionally expose:

```ts
responseAction: "interest" | "apply" | "none";
alreadyResponded: boolean;
responseState?: string | null;
canRespond: boolean;
ineligibilityReason?: string | null;
```

Do not make Native infer Quick/Casting from copy or unrelated fields.

## Responding to an opportunity

### Current risk

The web action is newer than the old mobile `/apply` endpoint: Quick currently means interest + request-linked conversation, while the old mobile endpoint only inserts an application.

### Required architecture

Extract a canonical server service shared by Web and API, conceptually:

```ts
respondToOpportunity({ userId, opportunityId, locale })
```

The service must:

- validate account restrictions and Talent approval/readiness
- validate opportunity availability and response window
- inspect `posting_mode`
- prevent duplicate response
- for Casting: create normal application
- for Quick: create/reuse application as interest and create/reuse request-linked conversation
- emit canonical events/notifications
- return product-safe response semantics

Recommended result:

```ts
type OpportunityResponseResult =
  | {
      ok: true;
      mode: "quick" | "casting";
      response: "interested" | "applied";
      applicationId: number | string;
      opportunityId: number;
      opportunitySlug: string | null;
      conversationId: string | null;
    }
  | {
      ok: false;
      code: string;
      details?: Record<string, unknown>;
    };
```

The public/native endpoint may remain `/api/opportunities/[id]/apply` for compatibility initially, but its behavior must call the canonical service. A semantically clearer endpoint can be introduced later without duplicating logic.

## Talent applications / request activity

### `GET /api/applications/mine`

Current contract is insufficient for Quick because conversation availability and display meaning are mode-dependent.

Required item fields:

```ts
type TalentResponseItem = {
  id: number | string;
  mode: "quick" | "casting";
  rawStatus: string;
  displayState:
    | "interested"
    | "conversation_open"
    | "preliminary_selected"
    | "materials_requested"
    | "publisher_confirmed"
    | "awaiting_talent_confirmation"
    | "mutually_confirmed"
    | "declined"
    | "applied"
    | "reviewing"
    | "shortlisted"
    | "accepted"
    | "rejected";
  createdAt: string | null;
  opportunity: {
    id: number | string;
    title: string | null;
    slug: string | null;
    city: string | null;
    countryCode: string | null;
    status: string | null;
  } | null;
  conversationId: string | null;
  requiresAction: boolean;
  nextAction?: "open_conversation" | "confirm" | "none";
};
```

For Quick, `conversationId` must be returned whenever a valid request-linked conversation exists, not only when raw application status equals `accepted`.

## Quick Request product-state resolver

Create a shared server resolver conceptually:

```ts
getQuickRequestProductState({ application, conversation, events, viewerRole })
```

Recommended output:

```ts
type QuickRequestProductState = {
  state:
    | "interested"
    | "conversation_open"
    | "preliminary_selected"
    | "materials_requested"
    | "publisher_confirmed"
    | "awaiting_talent_confirmation"
    | "mutually_confirmed"
    | "declined";
  canRequestMaterials: boolean;
  canPublisherConfirm: boolean;
  canTalentConfirm: boolean;
  canTalentDecline: boolean;
  canShareContact: boolean;
  requestedMaterials: Array<"portfolio" | "intro_video" | "measurements" | "availability">;
};
```

This resolver should become the shared truth for Web docks, Native Chat and notification/action rendering.

## Conversations

### `GET /api/conversations`

Retain existing list endpoint and extend items with opportunity mode/context where useful:

```ts
postingMode: "quick" | "casting" | null;
workflowState?: string | null;
requiresAction?: boolean;
```

### `GET /api/conversations/[id]`

Native detail contract should expose a renderable, authorization-safe conversation context.

Recommended shape:

```ts
{
  conversation: {
    id: number;
    opportunityId: number;
    opportunityTitle: string | null;
    postingMode: "quick" | "casting" | null;
    partyName: string;
    partyImageUrl: string | null;
    status: string | null;
  };
  workflow?: QuickRequestProductState | null;
  messages: ConversationTimelineItem[];
}
```

Timeline must be able to represent text, attachment/voice and system/workflow events. The exact storage source may differ; Native receives a renderable contract.

## Notifications

### `GET /api/notifications`

Retain current endpoint. Extend target routing so the server returns a canonical destination instead of requiring Native to infer from copy.

Recommended target model:

```ts
type NotificationTarget =
  | { screen: "conversation"; id: string | number }
  | { screen: "opportunity"; id: string | number }
  | { screen: "talent_profile"; id: string | number }
  | { screen: "talent_activity" }
  | { screen: "publisher_request"; id: string | number }
  | { screen: "publisher_applicants"; id: string | number }
  | { screen: "scene_article"; slug: string }
  | { screen: "none" };
```

Push payloads may alternatively carry a canonical safe `mlamh.net` URL as long as the server and Native deep-link router share the same route contract.

## Push devices

### `/api/mobile/devices`

Retain existing registration/unregistration contract and verify in production for iOS and Android.

Push permission remains an in-context Native decision; token synchronization must not force a permission prompt.

## Talent profile options

### `GET /api/mobile/profile-options`

Keep as the canonical mobile-facing source for selectable profile registries where appropriate.

It must remain aligned with current canonical data, especially:

- Saudi city registry (current supported cities)
- no active generic Other City option for new/current canonical editing
- global nationality registry and canonical nationality slugs
- AR/EN labels

Avoid hard-coding these registries across Native screens.

## Public talent discovery

### `GET /api/mobile/talents`

Retain and reconcile with current public Talent Directory rules.

Native needs server-side support for the existing public filters/order, including search, role, city, gender, nationality and relevant range filters.

Protected content must never be returned from this public endpoint.

## Talent current profile

### `GET/PATCH /api/talent/me`

Use as the preferred canonical current-Talent contract unless implementation audit proves `/api/talent/profile` has a distinct necessary responsibility.

Recommended additions:

```ts
completionPercent: number;
reviewState: "incomplete" | "ready_to_submit" | "under_review" | "changes_requested" | "rejected" | "approved";
readyToSubmit: boolean;
missingEssentials: string[];
```

These values must come from the existing canonical profile-readiness service rather than being reimplemented in Native.

### `/api/talent/onboarding`

Retain only for initial account/profile creation steps that are still required by current signup. Reconcile it with the simplified current web signup.

### `/api/talent/profile`

Audit against `/api/talent/me`. Avoid two competing mutation contracts for the same canonical fields.

## Talent media

Retain signed upload-ticket/finalize/reorder/delete pattern used by the old mobile client where still supported by current server routes.

Native adds client-side UX for:

- compression/preparation
- upload progress
- retry
- pending state
- gallery ordering

Authorization and signed storage paths remain server controlled.

## Publisher

### `GET /api/publisher/me`

Retain and extend. Native requires explicit publisher product context/capabilities.

Recommended additions:

```ts
publisherType: string | null;
publisherSubtype: string | null;
approvalStatus: string | null;
verificationStatus: string | null;
status: string | null;
canCreate: boolean;
canCreateQuick: boolean;
canCreateCasting: boolean;
needsAttentionCount?: number;
```

Do not use a generic `accepted` count as a universal Native metric because Quick `accepted` is preliminary selection semantics.

### `/api/publisher/onboarding`

Reconcile with current three publisher-facing onboarding paths while keeping backend compatibility.

### `/api/publisher/opportunities`

Expose `postingMode` and mode-appropriate counts/actions.

Recommended opportunity summary fields include:

```ts
postingMode: "quick" | "casting";
interestedCount?: number;
applicantCount?: number;
requiresAction?: boolean;
unreadConversationCount?: number;
```

### `/api/publisher/verification`

Retain. Verification remains separate from account approval.

## Publisher capabilities resolver

Create a shared server helper conceptually:

```ts
getPublisherCapabilities({ profile, publisher })
```

Recommended result:

```ts
{
  canCreate: boolean;
  canCreateQuick: boolean;
  canCreateCasting: boolean;
  canInvite: boolean;
  canViewProtectedTalentContent: boolean;
  approvalState: string;
  verificationState: string;
  restrictionReason: string | null;
}
```

Web and Native should consume the same capability logic.

## Scene Native read API

Current Scene web product requires a dedicated read contract for Native instead of direct database access.

Recommended endpoints:

```text
GET /api/scene/feed
GET /api/scene/article/[slug]
GET /api/scene/category/[slug]
GET /api/scene/search?q=
GET /api/scene/recommended
```

### Feed

Returns only Native-needed content:

- featured
- categories
- latest
- reports
- stories

### Article

Recommended fields:

```ts
slug
title
excerpt
cover
category
author
publishedAt
readingTime
body
sources
related
cta
```

Do not send web-only SEO JSON-LD requirements to Native.

### Recommended

Reuses the same state-aware personalization logic as the web product and returns safe article recommendations. Native copy can label them as `مقترح لك / قد يفيدك الآن` without exposing internal state logic.

## Qualification

Native must not duplicate qualification rules.

Opportunity/user-specific contracts should expose either capability fields or a canonical qualification result, for example:

```ts
{
  qualified: boolean;
  canRespond: boolean;
  mode: "local" | "travel" | "none";
  reasons: string[];
}
```

User-facing copy is localized by a presentation mapper; the server remains authoritative for the underlying eligibility.

## Protected Talent Content

Server contracts must enforce authorization before returning protected content.

A safe profile response may include:

```ts
protectedContent: {
  available: boolean;
  reason?: "login_required" | "publisher_not_eligible" | "restricted";
  data?: { /* authorized fields only */ };
}
```

Never return protected URLs/data to an unauthorized client and rely on Native to hide them.

## Market and locale

- Validate ISO-style market codes server-side.
- Saudi Arabia is the currently active talent residence market unless current product flags say otherwise.
- Currency, country, city labels and phone prefixes must be contract/config driven.
- Locale responses support Arabic and English in V1.

## P0 reconciliation before business-flow Native screens

1. Add explicit `postingMode` to opportunity-facing contracts.
2. Replace duplicated Web/API response logic with a canonical shared opportunity response service.
3. Make Quick response create/reuse conversation consistently across Web and API.
4. Update `/api/applications/mine` for Quick mode and correct conversation/state semantics.
5. Add publisher type/subtype/capabilities to the Native publisher/account context.
6. Stop treating raw `accepted` as a universal product meaning.
7. Add Native Scene read contracts.
8. Expose Quick workflow state/actions through a canonical server resolver.
9. Expose qualification/capability reasons without duplicating rules in Native.

## Release-gate backend verification

Before App Store / Play production release verify:

- account deletion + Apple authorization revocation path
- push device registration/unregistration
- iOS/Android deep-link destinations
- protected talent content authorization
- Quick Web/API semantic parity
- contact-sharing privacy after mutual confirmation
- publisher approval vs verification separation
- market/locale behavior
