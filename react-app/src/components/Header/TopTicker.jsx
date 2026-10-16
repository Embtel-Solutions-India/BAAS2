// Scrolling info strip shown under the logo/nav bar (sub header).
const ITEMS = [
  <>Bookkeeping, Taxes &amp; Payroll for <b>Bay Area</b> Businesses</>,
  <><a href="/#rush-service" className="ticker-rush"><b>Rush Service</b> Available</a> for urgent deadlines <i>(subject to availability)</i></>,
  <><b>4.4★</b> Google Reviews</>,
  <><b>500+</b> Businesses Served</>,
  <>QuickBooks Level 1 <b>Certified ProAdvisor</b></>,
  <><b>24hr</b> Average Response Time</>,
];

export default function TopTicker() {
  // The list is rendered twice so the CSS marquee can loop seamlessly (-50% translate).
  const row = (hidden) => (
    <div className="ticker-row" aria-hidden={hidden || undefined}>
      {ITEMS.map((item, i) => (
        <span className="ticker-item" key={i}>{item}</span>
      ))}
    </div>
  );

  return (
    <div className="ticker" role="region" aria-label="Highlights">
      <div className="ticker-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
