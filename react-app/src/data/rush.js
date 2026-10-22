// Single source of truth for Rush Service prices, fees, timelines, rules and copy
// (spec: "BAAS Rush Service — Website Build Spec", October 22, 2026).
// The home page, /rush-service, service pages, nav, footer, schema.org markup and the
// request form all read from here, so a price or timeline change is made once, in this file.
// All timelines are business days, Pacific Time.
//
// Values marked PROPOSAL are the 12 items in spec section 14 that Rahul must confirm before launch.

export const RUSH_PATH = '/rush-service';
export const PHONE_DISPLAY = '(510) 962-7300';
export const PHONE_TEL = 'tel:+15109627300';
export const PHONE_HOURS = 'Mon–Fri, 9 a.m.–5 p.m. PT'; // PROPOSAL (#2)
export const REPLY_WINDOW = 'within 4 business hours'; // PROPOSAL (#2)
export const EMAIL = 'info@bayareaaccountingsolutions.com';
export const ADDRESS = '39159 Paseo Padre Parkway, Suite 115, Fremont, CA 94538';

// ---- Tiers (spec section 4) -------------------------------------------------------------
export const RUSH_TIERS = [
  {
    id: 'priority', name: 'Priority', timeline: 'Within 5 business days', // PROPOSAL (#1)
    price: '+25%', min: 99, badge: null, note: null,
    bestFor: 'Deadlines a week or two away', button: 'Request Priority',
  },
  {
    id: 'express', name: 'Express', timeline: '2–3 business days',
    price: '+50%', min: 149, badge: 'Most requested', note: null,
    bestFor: 'Lender, lease or attorney deadlines this week', button: 'Request Express',
  },
  {
    id: 'emergency', name: 'Emergency', timeline: 'Next business day',
    price: '+100%', min: 249, badge: null, note: 'By approval, limited slots',
    bestFor: 'A hard deadline tomorrow', button: 'Request Emergency',
  },
];

export const RUSH_FROM = RUSH_TIERS[0].price; // "+25%"
export const tierPriceLine = (t) => `${t.price} (min. $${t.min})`;
export const TIER_FOOTER = 'Timeline starts when we receive complete documents. Business days, Pacific Time.';

// ---- How it works (spec section 3, block 2) ----------------------------------------------
export const RUSH_STEPS = [
  { title: 'Tell us your deadline', text: 'Fill in the short form or call us.' },
  { title: 'Get a written answer', text: `We confirm what's feasible, the tier, fee and timeline ${REPLY_WINDOW}.` },
  { title: 'Approve and pay the rush fee', text: 'Then upload documents to the secure client portal.' },
  { title: 'The clock starts', text: 'Your timeline begins once we have complete documents.' },
];

// ---- Pricing table (spec section 5) ------------------------------------------------------
// `id` becomes the row anchor: /rush-service#pricing-<id>
export const PRICING_ROWS = [
  { id: 'bookkeeping', service: 'Monthly bookkeeping close', standard: 'From $250 per 100 transactions', priority: '+25% (from $99)', express: '+50% (from $149)', emergency: '+100% (from $250)' },
  { id: 'personal-tax', service: 'Personal tax return', standard: 'From $550', priority: '+25% (from $139)', express: '+50% (from $275)', emergency: 'Extension filed next business day — $99*' },
  { id: 'business-tax', service: 'Business tax return', standard: 'From $650', priority: '+25% (from $165)', express: '+50% (from $325)', emergency: 'Extension filed next business day — $99*' },
  { id: 'cleanup', service: 'Cleanup and catch-up (up to 12 months)', standard: 'Custom quote', priority: '10 business days, +25%', express: '5 business days, +50%', emergency: 'Not available' },
  { id: 'payroll', service: 'Off-cycle payroll (final pay, bonus, correction)', standard: '—', priority: '—', express: '—', emergency: '$95 per run + $10 per employee, submitted same business day**' },
  { id: 'formation', service: 'California business formation', standard: 'From $2,500', priority: '—', express: 'Filed within 1 business day: +$250 + $350 state fee (state responds within 24 hours)', emergency: 'Filed same day: +$395 + $750 state fee (info needed by 5 p.m. PT the prior business day)' },
  { id: 'registered-agent', service: 'Registered agent', standard: '$199 per year', priority: 'Same-day activation included', express: 'Same-day activation included', emergency: 'Same-day activation included' },
];

export const PRICING_COLUMNS = ['Service', 'Standard price', 'Priority (5 business days)', 'Express (2–3 business days)', 'Emergency (next business day)'];

export const PRICING_FOOTNOTES = [
  '* An extension gives more time to file, not more time to pay. The return itself is then completed on the Priority timeline.',
  '** Payroll is submitted the same business day if the request is confirmed by 11 a.m. PT. When the money reaches employees depends on the payroll provider and the banks.',
  'State fees are charged at cost and are non-refundable, even if the state rejects a filing.',
  'Cleanup and catch-up rush is available for up to 1,200 transactions and 3 accounts; larger jobs get a custom timeline.', // PROPOSAL (#6)
];

export const pricingAnchor = (id) => `${RUSH_PATH}#pricing-${id}`;

// ---- Packages (spec section 6) -----------------------------------------------------------
// `service` must match an option in FORM_SERVICES so the button can pre-select the form.
export const RUSH_PACKAGES = [
  {
    id: 'tax-deadline-rescue', service: 'Tax Deadline Rescue', title: 'Tax Deadline Rescue',
    description: 'Behind on your books and facing a filing deadline?',
    included: ['Catch-up bookkeeping (up to 12 months)', 'Business tax return', 'E-filing', 'Extension filed first if needed'],
    timeline: '7–10 business days from complete documents', price: 'Custom quote — one rush fee on the total, never stacked',
    schemaPrice: null, button: 'Rescue my deadline', smallPrint: null,
  },
  {
    id: 'lender-ready', service: 'Lender-Ready Financials', title: 'Lender-Ready Financials',
    description: 'For a loan, mortgage or commercial lease application.',
    included: ['Year-to-date profit and loss', 'Balance sheet', 'Reconciled bank and card accounts', "Statements formatted for your lender's checklist"],
    timeline: '72 hours or 24 hours', price: '$395 (72 hours) · $595 (24 hours) — for clients with current books; catch-up quoted separately', // PROPOSAL (#7)
    schemaPrice: 395, button: 'Get my financials',
    smallPrint: 'Prepared financial statements, not a CPA-signed letter. Your lender decides what it accepts.',
  },
  {
    id: 'petition-ready', service: 'Petition-Ready Financials', title: 'Petition-Ready Financials (for immigration attorneys)',
    description: "Employer financial documents organized to your case checklist.",
    included: ['Company financial statements', 'Payroll summaries', 'Tax return copies', "Documents organized to the attorney's checklist"],
    timeline: '72 hours', price: '$495 per case', // PROPOSAL (#7)
    schemaPrice: 495, button: 'Send a case',
    smallPrint: 'Your attorney decides what is filed. We prepare and organize the financial documents.',
  },
  {
    id: 'launch-fast', service: 'Launch Fast', title: 'Launch Fast',
    description: 'Form your California company in one business day.',
    included: ["Articles filed with California's 24-hour expedite", 'EIN application', 'Registered agent activated same day'],
    timeline: 'Filed within 1 business day', price: 'From $2,500 + $250 rush + state fees at cost',
    schemaPrice: 2750, button: 'Start my company',
    smallPrint: 'The state decides approval timing. EIN timing is set by the IRS and is longer for owners without a Social Security number.',
  },
  {
    id: 'same-day-payroll-fix', service: 'Same-Day Payroll Fix', title: 'Same-Day Payroll Fix',
    description: 'Final paychecks, missed employees and payroll corrections.',
    included: ['Off-cycle payroll run', 'Tax withholding calculated', 'Pay stubs issued'],
    timeline: 'Submitted same business day if confirmed by 11 a.m. PT', price: '$95 per run + $10 per employee',
    schemaPrice: 95, button: 'Fix my payroll',
    smallPrint: 'When funds reach employees depends on the payroll provider and the banks.',
  },
];

// ---- Rules (spec section 7) --------------------------------------------------------------
export const RUSH_RULES_TITLE = 'How rush pricing works';
export const RUSH_RULES_LIST = [
  ['Written confirmation first.', 'A rush is booked only after we confirm the tier, fee and timeline in writing.'],
  ['When the clock starts.', 'Your timeline starts when we have complete documents. Requests confirmed after 12 p.m. PT start the next business day.'],
  ['Business days only.', 'All timelines are business days, Monday to Friday, Pacific Time, excluding federal holidays.'],
  ['Payment.', 'The rush fee is paid upfront, together with any state fees.'], // PROPOSAL (#11: how it is collected)
  ['Our promise.', 'If we confirm a rush timeline and miss it, we refund the rush fee.'], // PROPOSAL (#4)
  ['One rush fee per engagement.', 'Rush fees are never stacked across services in the same package.'],
  ['State and government fees', 'are charged at cost and are non-refundable, even if a filing is rejected.'],
  ['Late tax documents.', 'Tax documents received within 14 days of a filing deadline are automatically placed on the Priority tier.'],
  ['Monthly clients.', 'Clients on a monthly plan get one free Priority upgrade per quarter.'], // PROPOSAL (#5)
];
export const RUSH_RULES_NOTE = 'From February 1 to April 15, Emergency slots are limited. Request early.';

export const RUSH_DISCLAIMER =
  'Rush Service is subject to feasibility and availability. Timelines are business days in Pacific Time and begin when we receive complete documents. Government agencies, the IRS, lenders, payroll providers and banks set their own processing times, which are outside our control. Rush fees are in addition to standard service fees. Bay Area Accounting Solutions does not provide legal advice.';

// Short small print used under the home page rush section buttons (spec 2.2).
export const RUSH_SMALL_PRINT =
  'Rush Service is subject to feasibility and availability. Timelines are business days (Pacific Time) and start when we receive complete documents.';

// ---- FAQs (spec section 8; the first two are also shown on the home page, spec 2.4) ------
export const RUSH_FAQS = [
  {
    q: 'Do you offer rush service?',
    a: 'Yes. Rush is available for bookkeeping, taxes, payroll, cleanup and business formation, from +25% for Priority to +100% for next-business-day Emergency work.',
    link: { to: `${RUSH_PATH}#pricing`, label: 'See rush pricing' },
  },
  {
    q: 'When does the rush timeline start?',
    a: 'When we have your complete documents and have confirmed the rush in writing. Requests confirmed after 12 p.m. PT start the next business day.',
  },
];

export const LANDING_FAQS = [
  RUSH_FAQS[1],
  { q: "What if you can't meet my deadline?", a: "We tell you before you pay. If we can't do it, we suggest the fastest realistic option. If we confirm a timeline and miss it, we refund the rush fee." },
  { q: 'Can you prepare my tax return in 24 hours?', a: "We don't rush a full return into 24 hours because accuracy matters. We file an extension by the next business day, then complete the return on the Priority timeline. An extension gives more time to file, not more time to pay." },
  { q: 'Are state and government fees included?', a: 'No. They are charged at cost on top of our fees and are non-refundable, even if a filing is rejected.' },
  { q: 'Can you guarantee my LLC, EIN or payroll deposit by a certain date?', a: 'We guarantee when we submit. Approval and deposit timing is set by the state, the IRS, the payroll provider and the banks.' },
  { q: 'Is Lender-Ready Financials a CPA letter?', a: 'No. It is a set of prepared financial statements. Your lender decides what it accepts, so check their requirements before ordering.' },
  { q: 'Do monthly clients pay rush fees?', a: 'Monthly clients get one free Priority upgrade per quarter. Express and Emergency are charged at the normal rush rate.' },
  { q: 'How do I send my documents?', a: "After we confirm your rush, we send a link to our secure client portal. Please don't email tax documents or include ID or bank numbers in the request form." },
];

// ---- Request form options (spec section 9.1) --------------------------------------------
export const FORM_SERVICES = [
  'Monthly bookkeeping close', 'Personal tax return', 'Business tax return', 'Cleanup and catch-up', 'Off-cycle payroll',
  'California business formation', 'Registered agent', 'Tax Deadline Rescue', 'Lender-Ready Financials',
  'Petition-Ready Financials', 'Launch Fast', 'Same-Day Payroll Fix', 'Not sure',
];
export const FORM_TIERS = ['Priority', 'Express', 'Emergency', 'Not sure, help me choose'];
export const FORM_REASONS = [
  'Tax filing', 'Loan or mortgage', 'Lease', 'Immigration petition or RFE', 'Payroll', 'Company formation',
  'Investor or due diligence', 'IRS or state notice', 'Other',
];
export const FORM_DOCS = ['All ready', 'Some ready', 'Not yet'];

export const FORM_MESSAGES = {
  heading: 'Request Rush Service',
  sub: `Tell us your deadline. We'll reply ${REPLY_WINDOW} with what's possible.`,
  success: (first) =>
    `Thanks, ${first}. We've received your rush request. We'll reply ${REPLY_WINDOW} (${PHONE_HOURS}) with what's possible, the fee and the timeline. Need us sooner? Call ${PHONE_DISPLAY}.`,
  error: `Something went wrong. Please call ${PHONE_DISPLAY} or email ${EMAIL}.`,
  urgentWarning: "This may need Emergency. We'll confirm what's possible.",
  notesHelper: "Please don't include Social Security, bank account or card numbers.",
  consent: 'I agree to be contacted by phone, email or text about this request.',
};

// ---- Page copy / SEO (spec sections 3 and 10) --------------------------------------------
export const LANDING = {
  h1: 'Rush bookkeeping, tax and payroll help for urgent deadlines',
  sub: 'Published prices, real timelines, and a written yes or no before you pay. Based in Fremont, serving all 50 states.',
  title: 'Rush Bookkeeping, Tax & Payroll | Bay Area Accounting Solutions',
  description: 'Urgent deadline? Rush bookkeeping, tax and payroll from +25%, with next-business-day options. Clear prices, confirmed in writing. Fremont, CA.',
  closingHeading: "Deadline coming up? Let's see what we can do.",
  trust: ['4.4★ Google Reviews', '500+ Businesses Served', 'QuickBooks Level 1 Certified ProAdvisor', '24hr Average Response Time'],
};

// ---- Service-page strips (spec 2.6) -------------------------------------------------------
export const STRIP_SERVICES = {
  bookkeeping: 'Bookkeeping & Accounting',
  tax: 'Business & Individual Taxes',
  payroll: 'Payroll Management',
  cleanup: 'Accounting Cleanup',
  'bookkeeping-cleanup': 'Bookkeeping Cleanup & Catch-Up',
  formation: 'Business Formation & Consulting',
};

// Tier ids accepted by the request form / server (kept in sync with server/routes/rushRequests.js).
export const RUSH_TIER_OPTIONS = FORM_TIERS;
