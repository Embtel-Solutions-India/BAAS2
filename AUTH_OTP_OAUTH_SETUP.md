# Client Authentication — OTP & OAuth

Additive to the existing auth. **Admin login is unchanged.** Existing client
email/password login still works. This adds passwordless **email OTP** and
**Google/Microsoft OAuth** for clients. All methods end by issuing the app's
existing JWT session cookie, so `req.user`, RBAC, Socket.IO, orders, payments,
blogs, and messaging are untouched.

## How it works
- OTP / OAuth verify identity server-side → find-or-create the client **by
  email** (no duplicates) → issue the standard session cookie. Role is always
  `client`, derived server-side. Admin emails are rejected from client OTP/OAuth.
- New additive `Client` fields: `oauth_provider`, `oauth_provider_id`,
  `email_verified`, `mobile_verified`, `last_login`, `login_method`,
  `otp_verified`, `profile_image`. Passwordless clients get a random unusable
  `password_hash` (schema unchanged).

## Email OTP — works now, no setup
Uses the existing `EMAIL_*` (nodemailer) settings. If email isn't configured, in
non-production the code is logged to the server console and returned as
`devCode` so you can test immediately. OTP: 6 digits, 5-min expiry, hashed at
rest (SHA-256 + pepper), 60s resend cooldown, max 5 resends/window, max 5 verify
attempts, IP rate-limited (15/15min), audit-logged.

Endpoints: `POST /api/auth/otp/send`, `POST /api/auth/otp/resend`,
`POST /api/auth/otp/verify`. Discovery: `GET /api/auth/methods`.

## Mandatory email OTP on registration
Every **new** client sign-up now verifies the email with a 6-digit code
**before** the account is created — nothing is persisted until the code is
verified. Flow: fill form → `POST /api/auth/register/send-otp` (validates the
email, rejects admin emails + already-registered emails) → enter code →
`POST /api/auth/register/verify` (the full form travels here; on a valid code
the account is created with `email_verified`/`is_verified`/`otp_verified` = true
and the session cookie is issued). Resend: `POST /api/auth/register/resend-otp`.
Codes are purpose-scoped, so a login code can't complete a registration and
vice-versa. The legacy `POST /api/auth/register` endpoint is unchanged and still
present, but both registration UIs (the `/client-portal/register` page and the
header "Create Account" modal) now use the OTP-gated flow. **Admin login and
Google/Microsoft OAuth are untouched** — a provider-verified OAuth email is
trusted and skips the extra OTP.

## OAuth (Google / Microsoft) — needs your provider credentials
Each provider is **off until its client id + secret are set** — then its button
appears on the login page automatically (via `/api/auth/methods`).

1. **Google** — https://console.cloud.google.com → create OAuth client (Web).
   Authorized redirect URI: `http://localhost:4000/api/auth/oauth/google/callback`
   (swap host in prod). Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
2. **Microsoft** — https://portal.azure.com → App registrations → new registration.
   Redirect URI (Web): `http://localhost:4000/api/auth/oauth/microsoft/callback`.
   Set `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` (and `MICROSOFT_TENANT`
   if not `common`).
3. Set `OAUTH_REDIRECT_BASE` to your public server URL in production.

Flow: authorization-code + PKCE, CSRF-protected via a signed-JWT `state`, token
exchange server-side, identity from the `id_token`. Existing users link by email.

> The OAuth round-trip is **unverified in this build** — it requires the above
> credentials plus a browser. Email OTP is fully tested end-to-end.

## SMS / mobile OTP (future)
Structured but disabled. Add a provider (Twilio/SNS/MessageBird/Vonage) and a
send function; the OTP service is channel-agnostic.

## Login UI
The existing `/client-portal/login` page now shows: OAuth buttons (if
configured), the password form, and an "Email me a login code" OTP mode
(6 code boxes, auto-submit, resend timer). The register page and the header
"Create Account" modal now run the two-step OTP flow above (form → 6 code
boxes → verify). Admin login is unchanged.
