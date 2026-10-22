# Open items that need the site owner (audit of 22 Oct 2026)

These items cannot be completed by changing the website code. Each section says what was found, what is
needed, and who has to do it. Nothing here is published on the website.

---

## 1. Privacy Policy and Terms: DRAFT FOR COUNSEL (audit C6)

**This is a fact sheet for your lawyer, not legal advice and not publishable text.** It lists what the code
actually does, and what the current Privacy Policy does not mention, so the review is quick.

Current policy (checked 23 Oct 2026): "Last updated: January 1, 2025". Sections: Information We Collect, How We Use
It, Information Sharing, Data Security, Client Portal, SMS Communications, Cookies, Your Rights, Contact Us.
It already names Contentsquare/Hotjar, Zoho and "Do Not Sell".

### Outside services the website actually uses (from the code)

| Service | What it does here | Where in the code |
|---|---|---|
| Google tag / Google Ads (`AW-18506219893`) | Ad conversion measurement; loads on every page | `react-app/index.html`, form components |
| Contentsquare (includes Hotjar) | Site analytics / session recording | `react-app/index.html` |
| Zoho SalesIQ | Live chat widget and its cookie banner | `react-app/index.html` |
| Elfsight | Google Reviews widget (loads from `elfsightcdn.com`) | `components/Sections/GoogleReviewsWidget.jsx` |
| HighLevel / LeadConnector | Booking calendar (now embedded at `/book`) | `pages/Book/index.jsx` |
| Google Fonts | Fonts (the visitor's IP address reaches Google) | `react-app/index.html` |
| Gmail SMTP (via the server) | Sends form submissions to info@ and the Rush auto-reply | `server/config/email.js` |
| MongoDB Atlas | Client-portal accounts, orders, messages, blog | `server/config/db.js` |
| AWS S3 | Stored uploads (blog images and portal files) | `server/config/s3.js` |
| QuickBooks | Invoice / accounting integration | `server/services/quickbooks.js` |
| GoHighLevel webhook (optional) | Receives Rush requests if `GHL_RUSH_WEBHOOK_URL` is set | `server/routes/rushRequests.js` |

### Not mentioned in the current policy (for counsel to consider)

- Google Ads / Google tag, Elfsight, HighLevel booking, Google Fonts, and email handling of form submissions.
- California privacy rights (CCPA/CPRA): categories collected, right to know / delete / correct / opt out, how to ask.
- Data retention periods.
- What is collected by each form (Contact, Rush Service, quote forms) and the SMS/email consent wording used:
  "I agree to be contacted by phone, email or text about this request."
- The Terms page also shows "Last updated: January 1, 2025".

---

## 2. Google Analytics 4 and Search Console (audit A16, F1)

**Found:** the live pages load only the Google Ads tag (`AW-18506219893`) and Contentsquare. No GA4 tag
(`G-XXXXXXXX`) and no Search Console verification tag are in the page. (Search Console can also be verified by
DNS, which cannot be seen from the website.)

**Needed from you:**
1. In GA4, create or open the property and copy the Measurement ID (looks like `G-XXXXXXXXXX`).
2. Give it to your developer, who adds one line next to the existing tag in `react-app/index.html`:
   `gtag('config', 'G-XXXXXXXXXX');`
3. Check in Tag Assistant / GA4 DebugView that each event arrives once.

**Already built and waiting for GA4** (they send now, but only count once a GA4 tag exists):
`click_to_call`, `email_click`, `book_appointment_click`, `view_booking_page`, `generate_lead`,
and the Rush events (`rush_form_submit`, `rush_tier_click`, and others). Mark `generate_lead` and
`rush_form_submit` as key events in GA4.

---

## 3. Cookie consent (audit F3)

**Found:** a cookie banner does appear on the live site, but it is Zoho SalesIQ's, and it controls Zoho only. The Google
tag and Contentsquare load before anyone clicks anything.

**Decision for you and counsel:** whether those tags should wait for consent. Waiting (Google Consent Mode v2)
protects visitors in regulated regions but reduces the conversions Google Ads can measure. This is a legal and
marketing decision, so it was not changed.

---

## 4. Server redirects (audit A11)

See `docs/nginx-redirects.conf.example`: two nginx rules plus the commands to test them.

---

## 5. Manual checks that need a person

- **Facebook and Instagram links** (footer): both sites turn away automated checks, so click them on a computer and
  a phone.
- **A real booking test:** the calendar at `/book` was confirmed to load, show dates and time slots, and detect the
  visitor's time zone. A full booking, the confirmation email or text, reschedule and cancel were not tested,
  because that would create a real appointment. Book one test slot, confirm the emails, then cancel it.
- **Blog content (audit B5, B7):** in-article links to service pages, and the category / title wording on two
  posts, are database content edited in the blog admin.
- **"Small Business Tax Deductions Checklist for 2025"** (Resources page): the title says 2025 but the content needs
  a 2026 update first.
