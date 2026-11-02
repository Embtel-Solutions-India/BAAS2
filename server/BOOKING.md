# Appointment booking

## Which system is live on `/book`

`/book`, `/book/confirmation/:bookingId` and `/book/manage/:bookingId` use the **consultation booking system run by n8n** ("BAAS Consultation Booking: API Requests and Responses", October 2026). n8n owns the calendar, the Google Meet links, the CRM and the confirmation emails. Our server only relays the calls so the n8n links never reach the browser and no keys live in the website.

| Website route (our server) | Method | Relays to |
|---|---|---|
| `/api/booking/availability` | GET | `baas-free-slots` |
| `/api/booking` | POST | `baas-consultation` |
| `/api/booking/confirmation/:bookingId` | GET | `baas-booking-confirmation?booking_id=` |
| `/api/booking/cancel` | POST | `baas-booking-cancel` |
| `/api/booking/reschedule` | POST | `baas-booking-reschedule` |
| `/api/booking/services` | GET | answered by us (fixed list) |

Code: `server/routes/consultationBooking.js` (relay), `react-app/src/utils/consultationApi.js`, `src/pages/Book/{index,Confirmation,Manage}.jsx`, `src/components/Booking/{ConsultationForm,useConsultationSlots}`. Tests: `server/tests/consultationBooking.test.js`.

How the website follows the guide: the free times are loaded when `/book` opens and every 10 minutes; the `days` returned by a booking, cancel or reschedule replace the stored list; times in the past are hidden; `start_time` is sent back exactly as received (the clock time is read from the text and never converted through the browser's time zone); all five tracking values are always sent; buttons are disabled while a request is sending. Optional setting: `N8N_BOOKING_BASE` (default `https://n8n.embtelsolutions.ca/webhook`).

The sections below describe a **separate, MongoDB-based booking engine** (`/api/bookings`, admin page `/admin/bookings`) that was built first. It is not used by `/book` and holds no bookings; it is kept for now so it can be switched back on or removed.

---

# Custom MongoDB booking engine (not wired to /book)

Custom booking for `/book`: customers pick a date and a 30-minute time, enter their details and get a confirmation. Business hours are Los Angeles time (`America/Los_Angeles`), Monday to Friday, 9:30 AM to 6:00 PM, with lunch from 11:30 AM to 12:30 PM. That gives 15 appointments per weekday. Everything is configurable by an admin.

It runs on the existing stack (Express + MongoDB/Mongoose, nodemailer, React). No new database was introduced.

## How it fits together

| Layer | Files |
|---|---|
| Scheduling rules (pure, no database) | `utils/bookingSchedule.js` |
| Database models | `models/Booking.js`, `models/BookingSettings.js`, `models/BlockedPeriod.js` |
| Business logic | `services/bookingService.js` |
| Emails | `services/bookingNotify.js` |
| Public API | `routes/bookings.js` → `/api/bookings` |
| Admin API | `routes/adminBookings.js` → `/api/admin/bookings` (admin and staff login required) |
| Customer pages | `react-app/src/pages/Book/index.jsx` (`/book`), `pages/Book/Manage.jsx` (`/book/manage/:reference?token=…`) |
| Calendar components | `react-app/src/components/Booking/*` |
| Admin page | `react-app/src/pages/Admin/AdminBookings.jsx` (`/admin/bookings`, menu item "Appointments") |
| Tests | `tests/*.test.js` (`npm test`) |

## Timezone and daylight saving

* Dates are plain `YYYY-MM-DD` strings and times are `HH:mm`, both meaning Los Angeles wall-clock time. They are only turned into instants on the server, with luxon and the tz database, so PST/PDT is never hardcoded.
* Appointments are stored as UTC instants (`startAtUtc`, `endAtUtc`) plus the local date and times for display.
* A local time that does not exist (spring-forward gap) or repeats (fall-back) is never offered and is rejected if submitted.
* The browser's timezone is never used to decide availability. The page labels times "PST/PDT (Los Angeles time)".

## Preventing double bookings

Every booking stores `slotKeys`: each 15-minute cell it occupies. A **partial unique index** on `slotKeys` (confirmed bookings only) lets MongoDB itself reject an overlapping booking. If two customers submit the same slot together, one insert succeeds and the other fails with `409 SLOT_UNAVAILABLE`. Cancelling a booking removes it from the index (its status is no longer `confirmed`), so the slot opens again. This also protects durations that are longer than the start interval.

Retries are safe: the browser sends a fresh `idempotencyKey` per slot choice, and a repeated key returns the original booking instead of creating a second one.

## Public API

All availability is calculated on the server.

| Method and path | Purpose |
|---|---|
| `GET /api/bookings/config` | Business hours, timezone, appointment types, booking topics |
| `GET /api/bookings/available-dates?month=2026-11` | `availableDates` and `fullyBookedDates` for a month |
| `GET /api/bookings/available-slots?date=2026-11-05[&type=id]` | The day's slots; lunch slots are returned unavailable with `reason: "Lunch break"` |
| `POST /api/bookings` | Create a booking (returns `201` with `booking` and a one-time `accessToken`) |
| `GET /api/bookings/:reference?token=…` | Read one booking |
| `POST /api/bookings/:reference/cancel` | `{ token }`. Allowed up to `cancellationNoticeHours` before the start |
| `POST /api/bookings/:reference/reschedule` | `{ token, date, startTime }`. Issues a new token; the old link stops working |

The booking is read by its random reference **plus** a secret token (only a SHA-256 hash is stored). A wrong token and an unknown reference give the same `404`, so references cannot be probed. The server never trusts an end time, status or duration from the browser.

Errors: `400` validation (with per-field `fields`), `403` too late to change online, `404` not found, `409` slot taken / already changed, `429` rate limited, `503` booking switched off.

## Admin API (`/api/admin/bookings`)

Authentication is the site's existing cookie login. Admin and staff can read; only **admin** can change settings and blocks.

`GET /` (filters `q`, `status`, `from`, `to`, `type`, `page`, `limit`, `sort`) · `GET /stats` · `GET /export` (CSV) · `GET /:id` · `PATCH /:id` (notes, mark completed / no-show) · `POST /:id/cancel` · `POST /:id/reschedule` (both accept `silent: true` to skip the email) · `GET|PUT /settings` · `GET|POST /blocks` · `DELETE /blocks/:id`

Admin actions are recorded on the booking's `history` with the admin's email. The CSV export neutralises cells that start with `=`, `+`, `-` or `@`.

## Database (MongoDB)

No migration step: collections and indexes are created automatically on first use (`Booking.init()` builds the unique indexes when the app connects).

* `bookings`: customer details, `startAtUtc`/`endAtUtc`, local date and times, `status` (`confirmed`, `cancelled`, `completed`, `no_show`), `slotKeys` (unique when confirmed), `idempotencyKey` (unique), `accessTokenHash`, email delivery status per notification, `history`.
* `bookingsettings`: one document (`key: "default"`). Until an admin saves, the built-in defaults apply.
* `blockedperiods`: admin-blocked whole days or time ranges.

## Emails

Sent through the existing SMTP setup (`config/email.js`): customer confirmation (with a manage link), admin notification, and cancellation / reschedule notices. Delivery never blocks or undoes a booking: failures are retried up to 3 times and the outcome is stored on the booking (`notifications.*.status`) and shown in the admin drawer. A confirmation is never sent twice for one booking.

## Environment variables (server)

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://bayareaaccountingsolutions.com` | Base URL used in the manage links inside emails |
| `BOOKING_ADMIN_EMAIL` | `info@bayareaaccountingsolutions.com` | Who is notified of new bookings (can also be set in Admin → Appointments → Availability) |
| `BOOKING_WRITE_LIMIT` | `12` | Booking / cancel / reschedule requests allowed per IP every 15 minutes |
| `EMAIL_*`, `JWT_SECRET`, `MONGODB_URI`, `CLIENT_URL` | existing | Already used by the rest of the site. `CLIENT_URL` must include the site's origin for CORS |

Nothing secret is placed in the React code. The front end only needs `VITE_API_URL`, as before.

## Deploying

1. `cd server && npm install` (adds `luxon`; `mongodb-memory-server` is a dev-only test dependency) and restart the API.
2. `cd react-app && npm run build` (the prerender step leaves the live calendar out of the static `/book` HTML).
3. Make sure the web server serves `/book/manage/*` as the single-page app (the Vercel rewrite in `react-app/vercel.json` already does).
4. Open `/admin/bookings`, check Availability & settings, and make one test booking.

## Tests

`cd server && npm test` runs 31 tests: scheduling rules and daylight saving, the full public API against a throwaway in-memory MongoDB (including 8 simultaneous requests for one slot), rate limiting, email failure handling, and the admin API with login, roles, filters, blocks and settings. The first run downloads a MongoDB binary; set `BOOKING_TEST_SKIP_DB=1` to run only the pure tests.

## Known limitations

* No calendar invitation (.ics) or Google Calendar sync yet.
* Appointment durations and start intervals must be multiples of 15 minutes.
* The booking topics (General Inquiry, Tax Services, …) are defined in `services/bookingService.js` (`PURPOSES`).
