/**
 * Upserts the "QuickBooks Online bookkeeping & payroll" blog post.
 * Idempotent: matched by slug, so re-running after editing CONTENT below
 * updates the live post instead of creating a duplicate.
 *
 * Usage: node scripts/seedQuickBooksBlog.js   (requires MONGODB_URI in server/.env)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const Blog = require('../models/Blog');
const { SANITIZE_OPTS, calcReadingTime } = require('../controllers/blogController');

const SLUG = 'quickbooks-online-bookkeeping-payroll';

const CONTENT = `
<p>Most business owners don't know how their business is doing right now. Not because they don't care, but because they're busy running it. The receipts are in a shoebox, the bank feed hasn't been reconciled since spring, and the only time you see a real number is when your accountant calls in April.</p>
<p>That uncertainty has a cost. It shows up as the knot in your stomach before payroll, the guess you make before hiring, and the surprise tax bill you didn't plan for.</p>
<blockquote>The fix isn't working harder. It's having the right system and the right person keeping it honest.</blockquote>

<h2>What QuickBooks Online actually is</h2>
<p>QuickBooks Online is cloud-based accounting software from Intuit. Your books live securely online instead of on one office computer. That one change makes everything else easier.</p>
<ul>
  <li><strong>Log in from anywhere.</strong> Laptop, phone, or tablet. At the office, at a job site, or on vacation.</li>
  <li><strong>Bank and credit card feeds.</strong> Transactions flow in automatically, so nobody retypes statements.</li>
  <li><strong>Invoices and payments.</strong> Send invoices, accept card or ACH payments, and see who's paid and who hasn't.</li>
  <li><strong>Receipt capture.</strong> Snap a photo of a receipt and it's attached to the expense.</li>
  <li><strong>Reports on demand.</strong> Profit and loss, balance sheet, and cash flow in a few clicks.</li>
</ul>

<h2>The real benefit: real-time clarity</h2>
<p>With desktop software or spreadsheets, your numbers are only as current as the last time someone updated them. With QuickBooks Online, they're current today. That means you can answer the questions that keep you up at night with facts instead of guesses:</p>
<ul>
  <li>Can I afford to hire this month?</li>
  <li>Which customers owe me money, and for how long?</li>
  <li>Am I actually making money on this product or job?</li>
  <li>How much should I set aside for taxes this quarter?</li>
</ul>
<p>Your bookkeeper, your tax preparer, and you can all look at the same live file at the same time. No emailing files back and forth. No wondering which version is the latest.</p>

<h2>How it compares to the alternatives</h2>
<table>
  <thead>
    <tr><th></th><th>QuickBooks Online</th><th>Desktop software</th><th>Spreadsheets</th></tr>
  </thead>
  <tbody>
    <tr><th>Access</th><td><strong>Anywhere, any device</strong></td><td>One computer or remote setup</td><td>Wherever the file is</td></tr>
    <tr><th>Updates</th><td><strong>Automatic, always current</strong></td><td>Manual installs and upgrades</td><td>None</td></tr>
    <tr><th>Bank feeds</th><td><strong>Built in</strong></td><td>Varies</td><td>Manual entry</td></tr>
    <tr><th>Working with your accountant</th><td><strong>Shared live access</strong></td><td>Send backup files</td><td>Email copies</td></tr>
    <tr><th>Payroll</th><td><strong>Built in, same-day option</strong></td><td>Separate add-on</td><td>Separate service</td></tr>
    <tr><th>Accountant familiarity</th><td><strong>Widely used by U.S. small-business accountants</strong></td><td>Common but declining</td><td>Varies widely</td></tr>
  </tbody>
</table>
<p>Because QuickBooks is so widely used, it also connects with hundreds of apps you may already use, from payment processors to point-of-sale systems.</p>

<h2>Payroll without the "money out early" problem</h2>
<p>Here's something many owners don't realize until they switch. With many traditional payroll providers, you submit payroll a day or more ahead, and the money leaves your account before payday. That's cash you can't use while you wait.</p>
<p>QuickBooks Online Payroll works differently. On the Premium and Elite plans, you can approve payroll before 7:00 AM Pacific on payday. Funds leave your account that same day, and employees are paid that same day.</p>
<table>
  <thead>
    <tr><th></th><th>Money leaves your account</th><th>Employees are paid</th></tr>
  </thead>
  <tbody>
    <tr><th>Many traditional providers</th><td>1&ndash;2 days before payday</td><td>Payday</td></tr>
    <tr><th>QuickBooks Online Payroll (Premium &amp; Elite)</th><td><strong>Payday</strong></td><td><strong>Payday</strong></td></tr>
  </tbody>
</table>
<figure>
  <figcaption>Illustrative. Timing for other providers varies by plan. QuickBooks same-day direct deposit applies to Premium and Elite when payroll is approved before 7:00 AM PT; the Core plan pays next day.</figcaption>
</figure>
<p>What that means for you:</p>
<ul>
  <li><strong>Your cash stays in your account longer.</strong> Helpful when you're waiting on a customer payment.</li>
  <li><strong>Last-minute changes are easy.</strong> Late timesheet? A forgotten bonus? Fix it the morning of.</li>
  <li><strong>Payroll taxes and filings are handled.</strong> Federal and state payroll taxes are calculated, filed, and paid automatically.</li>
  <li><strong>Everything lands in your books.</strong> Payroll posts directly to QuickBooks, so your reports stay accurate.</li>
</ul>

<h2>Software is only as good as the person running it</h2>
<p>QuickBooks Online is powerful. It's also easy to get wrong. Miscategorized expenses, duplicate transactions, unreconciled accounts, and payroll set up with the wrong tax rates are common. Left alone, small errors pile up into messy books, missed deductions, and IRS notices.</p>
<p>That's where a certified QuickBooks ProAdvisor makes the difference. At Bay Area Accounting Solutions, our certified QuickBooks ProAdvisor team:</p>
<ol>
  <li><strong>Sets up QuickBooks Online correctly.</strong> Chart of accounts, bank feeds, and payroll built for your industry.</li>
  <li><strong>Cleans up books that have gotten behind.</strong> Whether it's three months or three years.</li>
  <li><strong>Reconciles and reviews every month.</strong> So your reports are accurate when you need them.</li>
  <li><strong>Runs payroll on your schedule.</strong> On time, every time, with taxes handled.</li>
  <li><strong>Explains your numbers in plain English.</strong> No jargon, just what it means for your business.</li>
</ol>

<h2>Local since 2006</h2>
<p>We've served Bay Area business owners from our Fremont office for 20 years, and today we support clients in all 50 states. You get a real team that knows your name and your business, not a call center.</p>
<p>When your books are clean and current, something shifts. You stop dreading the numbers. You make decisions with confidence. And you get back to the part of your business you actually love.</p>
<p>Want to see where your books stand? <a href="/contact">Book a free consultation</a> with our team or call <a href="tel:+15109627300">(510) 962-7300</a>.</p>
<p><em>QuickBooks is a registered trademark of Intuit Inc.</em></p>
`;

const POST = {
  title: "It's 11 p.m. Do you know how your business is doing?",
  slug: SLUG,
  shortDescription: 'Why QuickBooks Online, and the right person running it, brings real peace of mind: real-time books, same-day payroll, and a certified ProAdvisor keeping it clean.',
  metaTitle: 'QuickBooks Online Bookkeeping & Payroll Services',
  metaDescription: 'See your numbers in real time, run payroll without moving money days early, and let a certified QuickBooks ProAdvisor keep your books clean. Serving the Bay Area since 2006.',
  tags: ['QuickBooks Online', 'Bookkeeping', 'Payroll', 'QuickBooks ProAdvisor'],
  category: 'Bookkeeping & Payroll',
  author: 'BAAS Team',
  featured: true,
  status: 'published',
};

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (server/.env)');
  await mongoose.connect(process.env.MONGODB_URI);

  const content = sanitizeHtml(CONTENT.trim(), SANITIZE_OPTS);
  const existing = await Blog.findOne({ slug: SLUG });
  const blog = existing || new Blog({ slug: SLUG });

  Object.assign(blog, POST, { content, readingTime: calcReadingTime(content), updated_at: new Date() });
  if (!blog.publishedAt) blog.publishedAt = new Date();
  await blog.save();

  console.log(`[blog] ${existing ? 'Updated' : 'Created'} "${blog.title}" -> /blog/${SLUG}`);
}

run()
  .catch(err => { console.error('[blog] Seed failed:', err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
