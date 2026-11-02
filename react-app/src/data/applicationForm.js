// Application form options (spec: "Website Forms - Developer Requirements", Phase 1, October 2026).
// The exact words below are what the webhook expects: service names keep their "&" and capitals,
// speed values are lowercase. Change them only when the spec changes.

export const CLIENT_TYPES = ['Business', 'Individual', 'Both'];

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

export const PAYROLL_SERVICE = 'Payroll Management';

// `speeds` is the list shown for that service. A single speed means the visitor is not asked to choose.
export const APPLICATION_SERVICES = [
  { value: 'Bookkeeping & Accounting', speeds: ['standard', 'priority', 'express', 'emergency'] },
  { value: 'Business & Individual Taxes', speeds: ['standard', 'priority', 'express', 'emergency'] },
  { value: PAYROLL_SERVICE, speeds: ['standard', 'emergency'] },
  { value: 'Accounting Cleanup', speeds: ['standard', 'priority', 'express'] },
  { value: 'Business Formation & Consulting', speeds: ['standard', 'express', 'emergency'] },
  { value: 'Registered Agent Services', speeds: ['standard'] },
  { value: 'Bookkeeping Cleanup & Catch-Up', speeds: ['standard', 'priority', 'express'] },
];

// Labels shown next to each speed. Timelines match the Rush Service page (data/rush.js); prices live on that page only,
// and the form never sends prices.
export const SPEED_LABELS = {
  standard: 'Standard (regular timeline)',
  priority: 'Priority (within 5 business days)',
  express: 'Express (2–3 business days)',
  emergency: 'Emergency (next business day, by approval)',
};
