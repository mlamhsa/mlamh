# MLAMH Email OTP Setup

Status: REQUIRED RELEASE GATE
Date: 2026-09-09

## Product decision
Email/password signup in MLAMH uses a six-digit email OTP verification experience.

Canonical flow:

`Create account -> receive 6-digit code -> enter code in MLAMH -> verify -> prepare canonical account -> Talent Dashboard`

The user-facing signup confirmation email must contain the OTP token. A confirmation-link-only email is not the approved MLAMH experience.

## Supabase hosted project
Project ref: `aempbsenymvxwbxkxdxf`

Manual dashboard path:

1. Open Supabase Dashboard.
2. Select the MLAMH project.
3. Go to **Authentication -> Email Templates**.
4. Open **Confirm signup**.
5. Replace the confirmation-link-only template with the OTP template below.
6. Save.
7. Run a real signup smoke test with a brand-new email.

## Recommended subject

Arabic-first:

`{{ .Token }} رمز التحقق من ملامح | MLAMH verification code`

## Recommended HTML

```html
<div dir="rtl" style="margin:0;padding:32px 16px;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;text-align:center">
  <div style="max-width:520px;margin:0 auto;border:1px solid rgba(201,169,98,.28);border-radius:24px;padding:32px 24px;background:#111111">
    <div style="font-size:14px;letter-spacing:.08em;color:#c9a962;margin-bottom:18px">MLAMH · ملامح</div>
    <h1 style="font-size:26px;line-height:1.5;margin:0;color:#ffffff">تأكيد بريدك الإلكتروني</h1>
    <p style="font-size:14px;line-height:1.9;color:#b7b7b7;margin:14px 0 0">
      استخدم رمز التحقق التالي لإكمال إنشاء حسابك في ملامح.
    </p>
    <div dir="ltr" style="margin:28px auto 18px;display:inline-block;padding:16px 24px;border-radius:16px;background:#17140d;border:1px solid rgba(201,169,98,.45);font-size:34px;font-weight:700;letter-spacing:.28em;color:#d8b76b">
      {{ .Token }}
    </div>
    <p style="font-size:12px;line-height:1.8;color:#777777;margin:12px 0 0">
      إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.
    </p>
    <div style="height:1px;background:#242424;margin:26px 0 20px"></div>
    <p dir="ltr" style="font-size:12px;line-height:1.8;color:#777777;margin:0">
      Use the verification code above to finish creating your MLAMH account.
    </p>
  </div>
</div>
```

## Important template variable
Use `{{ .Token }}`. Do not rely on `{{ .ConfirmationURL }}` for the canonical MLAMH signup verification experience.

## Application behavior already expected
The verification screen calls Supabase `verifyOtp` using:

- email address
- six-digit token
- `type: "email"`

Resend must send another signup verification message and reset the resend timer.

## Release smoke test
Do not close Talent Flow V1 until all of the following pass:

- New email signup succeeds.
- Email arrives with a visible six-digit OTP.
- No localhost URL is required by the user.
- OTP accepts valid code.
- Invalid/expired code shows a clear error.
- Resend sends a new code.
- Successful verification creates/prepares the canonical Talent account exactly once.
- Signup data is preserved and appears in the Talent profile.
- User lands in Talent Dashboard without a duplicate onboarding step.
- Existing Talent accounts are not rewritten by this flow.
