# Build 11 QA — Apple signup

Observed on physical iPhone via TestFlight Build 11:

- Sign in with Apple native sheet opens successfully.
- Apple account creation succeeds and returns name + private relay email.
- App routes correctly to account completion.
- Saving name + international phone fails with the generic account-save error.

Root cause confirmed from production runtime + database constraint:
`POST /api/account/details` returned HTTP 500 while the route wrote `profiles.onboarding_step = account_details_completed`, but the live database constraint only permits `account_details` for that stage.

A targeted backend hotfix is being handled separately from PR #112. PR #112 remains Draft/unmerged and no public store release is implied.
