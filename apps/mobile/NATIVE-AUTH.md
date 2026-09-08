# MLAMH Mobile Native Auth

## Sign in with Apple

- iOS uses `expo-apple-authentication` and exchanges the Apple identity token with Supabase through `signInWithIdToken`.
- Apple Developer App ID: `net.mlamh.app` with Sign in with Apple enabled as the primary App ID.
- Supabase Production Apple provider is enabled with Client ID `net.mlamh.app`; native iOS does not depend on the OAuth secret field.
- Apple only provides the user's full name on the first authorization; the app persists it to Supabase user metadata when available.
- Phone remains a required MLAMH account field and is collected in the post-auth account-completion step for new social accounts.
- Apple buttons are intentionally iOS-only until the separate Android/Web OAuth Services ID + secret flow is configured.
- The mobile dependency set is aligned to the current Expo SDK 57 patch requirements before the Build 11 candidate is cut.
- Account deletion must revoke Apple authorization before App Store release; this remains a release gate until the revocation flow is implemented and verified with a disposable test account.
