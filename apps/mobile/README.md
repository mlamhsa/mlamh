# MLAMH Native V3

This app is the native client for the current MLAMH product.

## Sources of truth

- **Visual / hierarchy:** current Mobile Web.
- **Business behavior:** current `main` backend and shared product contracts.
- **Legacy Build 14:** technical infrastructure source only; legacy screens and product semantics are not UX references.

## V3 rules

1. Never render raw backend statuses when the product meaning depends on context such as `posting_mode`.
2. Quick Request and Casting are separate product semantics even when they reuse backend records.
3. Approval, verification and Featured are distinct concepts.
4. No public phone / WhatsApp exposure and no open DMs.
5. Protected talent content authorization remains server-side.
6. Saudi Arabia is the active launch market, but market-specific values must come from configuration rather than being scattered through UI components.
7. Arabic RTL and English LTR are first-class from the beginning.
8. Native behavior may improve interaction, loading, transitions, caching and permissions, while public visual hierarchy stays close to the Mobile Web users already know.

## Local setup

Copy `.env.example` to `.env.local` and provide the Expo public Supabase configuration for the intended environment.

```bash
cd apps/mobile
npm install
npm run typecheck
npm run start
```

## Release identity

- iOS bundle identifier: `net.mlamh.app`
- Android package: `net.mlamh.app`
- V3 foundation starts from build/version code **15**.
- EAS project identity is preserved from the previous native foundation.

App icon / final splash assets are intentionally not copied from the legacy branch yet; they will be brought forward only after confirming the current MLAMH brand assets and Store requirements.
