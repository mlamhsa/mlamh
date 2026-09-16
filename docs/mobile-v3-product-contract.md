# MLAMH Mobile V3 — Product Contract

Status: implementation reference for Native V3. This document does not replace the current web product; it aligns Native V3 with the current `main` product semantics.

## Source of truth

1. Current `main` business rules and server-side services are the functional source of truth.
2. Current Mobile Web is the visual and information-hierarchy reference for public surfaces.
3. Native V3 may improve interaction, performance, navigation, loading, media, haptics, permissions, push and deep-link behavior, but must not silently redefine business semantics.
4. Build 14 / `feat/mobile-platform-phase0` is a technical foundation source only. Its old screens and product wording are not the UX source of truth.

## Core roles

### Talent

Launch roles are Actor and Model. A talent may browse public content before approval, but application/interest actions remain controlled by server-side eligibility and review state.

### Publisher

The product exposes publisher-facing paths such as Individual / Project Owner, Store / Business and Company / Organization while preserving backend compatibility. Native UI must not infer capabilities from labels alone; it consumes server-side capabilities.

## Review and trust are different concepts

### Talent review state

Native presentation state:

- `incomplete`
- `ready_to_submit`
- `under_review`
- `changes_requested`
- `rejected`
- `approved`

Backend values may differ. The Native UI consumes an adapter/canonical API representation and must not show raw database status names.

### Publisher approval state

Native presentation state:

- `incomplete`
- `under_review`
- `changes_requested`
- `rejected`
- `approved`
- `suspended`

### Publisher verification state

Verification is an independent trust layer:

- `unverified`
- `pending`
- `verified`
- `rejected`

`approved` is not `verified`, and `verified` must not be used as a substitute for account approval.

## Opportunity modes

Every Native opportunity must resolve to exactly one product mode:

- `quick`
- `casting`

The app must never infer this only from visible copy. The API contract should expose `postingMode` / product mode explicitly.

### Quick Request semantics

User-facing action: `أنا مهتم / I'm interested`.

Quick Requests reuse `opportunity_applications`, conversations, events and notifications, but their product semantics differ from Casting.

An application row with raw status `accepted` in a Quick Request is a **preliminary selection**, not a final acceptance.

Canonical Native Quick Request state:

- `interested`
- `conversation_open`
- `preliminary_selected`
- `materials_requested`
- `publisher_confirmed`
- `awaiting_talent_confirmation`
- `mutually_confirmed`
- `declined`

The server/product adapter should compute the state from application + conversation + workflow events. Screens must not reimplement event-combination logic independently.

Quick Request workflow:

1. Talent expresses interest.
2. Request-linked conversation is created/reused.
3. Publisher may make a preliminary selection.
4. Publisher may request work samples/details: portfolio, intro video, measurements/details, availability.
5. Publisher confirms the selection.
6. Talent explicitly confirms or declines.
7. Only after mutual confirmation may either side explicitly share its own saved mobile number into the conversation.

Privacy rules:

- No automatic phone exposure.
- No public WhatsApp exposure.
- No open DMs.
- All Quick workflow actions require a request-linked authorized conversation.
- Contact sharing is explicit and available only after mutual confirmation.

### Casting semantics

User-facing action: `تقدّم الآن / Apply`.

Canonical Native Casting state:

- `applied`
- `reviewing`
- `shortlisted`
- `accepted`
- `rejected`

For Casting, `accepted` retains its final acceptance meaning unless current server rules explicitly introduce another state.

## Conversation contract

Messaging is contextual, not a general open-DM network.

A Native conversation should expose or derive:

- conversation id
- opportunity id/title
- opportunity mode
- counterpart identity
- unread count
- workflow/presentation state
- allowed actions
- contact-sharing state

Native Chat renders a timeline capable of supporting:

- text messages
- attachments
- voice messages
- system/workflow events

A conversation screen must not decide authorization locally. Membership and workflow action authorization remain server-side.

## Protected talent content

Protected professional content may include showreel/video, portfolio links and social/contact references depending on current rules.

Rules:

- Protected fields must not be returned to unauthorized clients merely to be hidden in the UI.
- Native should receive an authorization-safe payload and a clear locked/unlocked state.
- Login alone is not sufficient if the current server requires a qualified publisher state.

## Public guest experience

A guest can browse:

- Home
- Talent Directory
- public Talent Profile
- Opportunities
- Quick/Casting discovery
- Scene
- public Publisher surfaces

Authentication is requested when the user attempts a protected action such as:

- apply / express interest
- invite
- message
- protected content
- account action

## Native navigation direction

### Talent bottom navigation

- Home
- Opportunities
- My Requests / Applications
- Messages
- Profile

### Publisher bottom navigation

Recommended V1 direction:

- Home
- Talents
- Create (+)
- Messages
- Account

Applicants/interested users remain contextual to each request/opportunity rather than becoming a permanent tab.

### Scene

Scene is a product surface and remains discoverable from Home/Menu and state-aware recommendations. It is not required to be a primary bottom tab in V1.

## Home principles

Native Home is a decision surface, not a dense SaaS dashboard.

### Approved Talent

Priority order:

- matched/relevant opportunities
- items needing attention
- recent request/application activity
- personalized Scene guidance

### Publisher

Priority order:

- create request/opportunity
- items needing attention
- active requests/opportunities
- relevant talent discovery
- personalized Scene guidance

Avoid vanity metrics when they do not lead to an action.

## Public visual parity

High visual parity with current Mobile Web is expected for:

- Home
- Talent Directory
- public Talent Profile
- Opportunities discovery/detail
- Join/Login
- Scene Home/Article

Native substitutions are encouraged where appropriate:

- web selects → native bottom sheets
- file inputs → native camera/gallery pickers
- browser share → native share sheet
- browser speech → native TTS
- pagination → controlled infinite scroll when safe
- web route transitions → native navigation

## Permissions

Ask in context only:

- Photos: when adding/selecting media
- Camera: when user chooses camera
- Microphone: when recording voice
- Notifications: after a meaningful action or from Settings

No permission barrage on first launch.

## Localization and markets

- Arabic and English are V1 requirements.
- RTL/LTR must include layout, gestures, arrows, galleries, chips, sheets and transitions.
- Saudi Arabia remains the active launch market.
- Market-specific values must come from market configuration / backend contracts rather than repeated UI hard-coding.

## V1 scope

### Public

Home, Talents, Talent Profile, Opportunities, Quick, Casting, Scene.

### Auth

Join, Login, Forgot/Reset Password, Talent signup, Publisher signup.

### Talent

Home, Profile Studio, review states, applications/requests, invitations, messages, notifications.

### Publisher

Home, Talent discovery, Quick creation, Casting creation, requests/opportunities, interested/applicants, invitations, messages, verification/profile.

### Native platform

Push, deep links, share, camera/gallery, voice, basic caching, AR/EN.

## Deferred by default

Unless a later decision promotes them:

- Saved Opportunities
- Universal Search
- matching percentage score
- paid subscription/paywall UX
- followers/likes/social feed
- full offline mode
- biometric login
- tablet-specific UI
- additional active markets

## Non-negotiable semantic rules

- `Featured` is not `Verified`.
- `Approved` is not `Verified`.
- Quick preliminary selection is not final acceptance.
- Quick interest is not Casting application copy.
- No public phone/WhatsApp exposure.
- No open DMs.
- Server-side authorization is authoritative.
- Raw backend statuses must not be shown directly without a product adapter/presentation mapping.
