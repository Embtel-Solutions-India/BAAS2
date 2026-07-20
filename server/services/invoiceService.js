/**
 * Invoice service — additive, self-contained.
 *
 * Generates a professional branded PDF for a paid invoice, stores it once on
 * local disk (mirroring the Document storage pattern), records the file path on
 * the Invoice, and transparently regenerates the file if it is ever missing.
 *
 * Nothing here changes the existing invoice-creation logic in the checkout
 * controller; it only *adds* a persistent, re-downloadable PDF on top of the
 * Invoice records that flow already produces.
 */
const fs   = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Invoice, Order, Client, Payment, Company } = require('../models');

const ACCENT = '#d4001f';
const INK    = '#1a1a1a';
const MUTE   = '#6b7280';
const LINE   = '#e5e7eb';

const INVOICE_ROOT = path.join(__dirname, '..', 'uploads', 'invoices');

/** Seller (BAAS) company details — env-overridable, branded defaults. */
function getCompanyInfo() {
  return {
    name:    process.env.COMPANY_NAME    || 'Bay Area Accounting Solutions',
    address: process.env.COMPANY_ADDRESS || '39899 Balentine Drive, Suite 200, Newark, CA 94560',
    phone:   process.env.COMPANY_PHONE   || '(510) 962-7300',
    email:   process.env.COMPANY_EMAIL   || 'accounting@bayareaaccountingsolutions.com',
    website: process.env.COMPANY_WEBSITE || 'www.bayareaaccountingsolutions.com',
    logo:    process.env.COMPANY_LOGO_PATH || null,
  };
}

const money = (n, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(Number(n || 0));

const longDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

/**
 * Collect every field the PDF needs, joining the invoice to its order, client
 * and payment. All lookups tolerate missing links (older/partial data).
 */
async function gatherInvoiceData(invoice) {
  const [order, client, payment] = await Promise.all([
    invoice.order_id ? Order.findById(invoice.order_id).populate('service_id', 'name') : null,
    Client.findById(invoice.client_id),
    Payment.findOne({ invoice_id: invoice._id }).sort({ created_at: -1 }),
  ]);

  let company = null;
  if (client) company = await Company.findOne({ client_id: client._id });

  const serviceName =
    invoice.service_name ||
    (order && order.service_id ? order.service_id.name : null) ||
    'Professional Services';

  const paymentMethod = (() => {
    if (payment && payment.card_type && payment.card_last4)
      return `${payment.card_type} •••• ${payment.card_last4}`;
    if (payment && payment.card_last4) return `Card •••• ${payment.card_last4}`;
    return invoice.payment_method
      ? invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1)
      : 'Card';
  })();

  return {
    invoice,
    order,
    client,
    company,
    serviceName,
    paymentMethod,
    transactionId: invoice.transaction_id || (payment ? payment.transaction_id : null),
    currency: invoice.currency || (order ? order.currency : 'USD') || 'USD',
  };
}

/** Render the invoice to a PDF Buffer using pdfkit (no external assets required). */
function renderPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const { invoice, order, client, company, serviceName, paymentMethod, transactionId, currency } = data;
      const co = getCompanyInfo();
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageLeft = doc.page.margins.left;
      const pageRight = doc.page.width - doc.page.margins.right;
      const contentW = pageRight - pageLeft;

      // ── Header: branded mark + company block ──────────────────────
      let headerBottom = 50;
      if (co.logo && fs.existsSync(co.logo)) {
        try { doc.image(co.logo, pageLeft, 45, { fit: [130, 46] }); headerBottom = 95; } catch { /* fall through */ }
      } else {
        doc.roundedRect(pageLeft, 45, 42, 42, 8).fill(ACCENT);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text('B', pageLeft, 53, { width: 42, align: 'center' });
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(15).text('BAAS', pageLeft + 52, 50);
        doc.fillColor(MUTE).font('Helvetica').fontSize(8).text('BAY AREA ACCOUNTING SOLUTIONS', pageLeft + 52, 70, { characterSpacing: 0.5 });
        headerBottom = 95;
      }

      // "INVOICE" title (right aligned)
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(26).text('INVOICE', pageLeft, 48, { width: contentW, align: 'right' });
      doc.fillColor(MUTE).font('Helvetica').fontSize(9)
        .text(invoice.invoice_number || '', pageLeft, 80, { width: contentW, align: 'right' });

      // Company contact block
      doc.fillColor(MUTE).font('Helvetica').fontSize(8.5);
      const coY = headerBottom + 6;
      doc.text(co.name, pageLeft, coY, { width: contentW * 0.6 });
      doc.text(co.address, { width: contentW * 0.6 });
      doc.text(`${co.phone}  ·  ${co.email}`, { width: contentW * 0.6 });
      doc.text(co.website, { width: contentW * 0.6 });

      // ── Meta box (right): dates + status ──────────────────────────
      const metaTop = coY;
      const metaX = pageLeft + contentW * 0.62;
      const metaW = contentW * 0.38;
      const metaRow = (label, value, y) => {
        doc.fillColor(MUTE).font('Helvetica').fontSize(8.5).text(label, metaX, y, { width: metaW * 0.5 });
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5).text(value, metaX + metaW * 0.5, y, { width: metaW * 0.5, align: 'right' });
      };
      metaRow('Invoice Date', longDate(invoice.paid_at || invoice.created_at), metaTop);
      metaRow('Order #', order ? order.order_number : '—', metaTop + 15);
      metaRow('Status', (invoice.status || 'paid').toUpperCase(), metaTop + 30);

      let y = coY + 74;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(LINE).lineWidth(1).stroke();
      y += 18;

      // ── Bill To / Payment ─────────────────────────────────────────
      const clientName = client ? `${client.first_name} ${client.last_name}`.trim() : 'Customer';
      doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(8.5).text('BILL TO', pageLeft, y, { characterSpacing: 0.5 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(clientName, pageLeft, y + 13);
      doc.fillColor(MUTE).font('Helvetica').fontSize(9);
      let by = y + 28;
      if (company && company.legal_name) { doc.text(company.legal_name, pageLeft, by); by += 12; }
      else if (client && client.company_name) { doc.text(client.company_name, pageLeft, by); by += 12; }
      if (client && client.email) { doc.text(client.email, pageLeft, by); by += 12; }
      if (client && client.phone) { doc.text(client.phone, pageLeft, by); by += 12; }

      // Payment block (right)
      const payX = pageLeft + contentW * 0.62;
      doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(8.5).text('PAYMENT', payX, y, { width: metaW, characterSpacing: 0.5 });
      doc.fillColor(INK).font('Helvetica').fontSize(9);
      doc.text(`Method: ${paymentMethod}`, payX, y + 14, { width: metaW });
      doc.text(`Status: ${invoice.status === 'paid' ? 'Paid' : (invoice.status || 'Pending')}`, payX, y + 27, { width: metaW });
      if (transactionId) doc.text(`Txn: ${transactionId}`, payX, y + 40, { width: metaW });

      y = Math.max(by, y + 56) + 14;

      // ── Line-items table ──────────────────────────────────────────
      const cols = { desc: pageLeft, qty: pageLeft + contentW * 0.55, price: pageLeft + contentW * 0.7, total: pageLeft };
      const rowRight = pageRight;
      // header band
      doc.rect(pageLeft, y, contentW, 22).fill('#f9fafb');
      doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(8.5);
      doc.text('DESCRIPTION', cols.desc + 8, y + 7);
      doc.text('QTY', cols.qty, y + 7, { width: contentW * 0.12, align: 'center' });
      doc.text('UNIT PRICE', cols.price, y + 7, { width: contentW * 0.15, align: 'right' });
      doc.text('AMOUNT', rowRight - contentW * 0.15 - 8, y + 7, { width: contentW * 0.15, align: 'right' });
      y += 22;

      const subtotal = Number(invoice.subtotal || 0);
      const tax = Number(invoice.tax || 0);
      const discount = Number(invoice.discount || 0);
      const total = Number(invoice.total || subtotal + tax - discount);

      // single line item (order → service)
      doc.fillColor(INK).font('Helvetica').fontSize(10);
      const descY = y + 9;
      doc.text(serviceName, cols.desc + 8, descY, { width: contentW * 0.5 });
      if (order && order.state) {
        doc.fillColor(MUTE).font('Helvetica').fontSize(8).text(`State: ${order.state}`, cols.desc + 8, descY + 14, { width: contentW * 0.5 });
      }
      doc.fillColor(INK).font('Helvetica').fontSize(10);
      doc.text('1', cols.qty, descY, { width: contentW * 0.12, align: 'center' });
      doc.text(money(subtotal, currency), cols.price, descY, { width: contentW * 0.15, align: 'right' });
      doc.text(money(subtotal, currency), rowRight - contentW * 0.15 - 8, descY, { width: contentW * 0.15, align: 'right' });
      y = descY + 30;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(LINE).lineWidth(1).stroke();
      y += 12;

      // ── Totals ────────────────────────────────────────────────────
      const totX = pageLeft + contentW * 0.55;
      const totW = contentW * 0.45;
      const totalRow = (label, value, bold = false, color = INK) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(bold ? color : MUTE)
          .text(label, totX, y, { width: totW * 0.55 });
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(color)
          .text(value, totX + totW * 0.55, y, { width: totW * 0.45, align: 'right' });
        y += bold ? 20 : 16;
      };
      totalRow('Subtotal', money(subtotal, currency));
      if (discount > 0) totalRow('Discount', `- ${money(discount, currency)}`);
      totalRow('Tax', money(tax, currency));
      doc.moveTo(totX, y + 1).lineTo(pageRight, y + 1).strokeColor(LINE).lineWidth(1).stroke();
      y += 8;
      totalRow('Total', `${money(total, currency)} ${currency}`, true, ACCENT);

      // Paid stamp
      if (invoice.status === 'paid') {
        doc.save();
        doc.rotate(-12, { origin: [pageLeft + 90, y + 40] });
        doc.roundedRect(pageLeft + 30, y + 20, 120, 40, 6).lineWidth(2).strokeColor(ACCENT).stroke();
        doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(22).text('PAID', pageLeft + 30, y + 30, { width: 120, align: 'center' });
        doc.restore();
      }

      y += 40;

      // ── Footer: terms + thank you (kept on a single page) ─────────
      // Pin the footer near the bottom; single-item invoices never reach here,
      // so this keeps everything comfortably on one page.
      const footerY = Math.max(y, doc.page.height - 150);
      doc.moveTo(pageLeft, footerY).lineTo(pageRight, footerY).strokeColor(LINE).lineWidth(1).stroke();
      doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(8.5).text('TERMS & CONDITIONS', pageLeft, footerY + 10, { lineBreak: false });
      doc.fillColor(MUTE).font('Helvetica').fontSize(8)
        .text(process.env.INVOICE_TERMS ||
          'Payment is due upon receipt. This invoice confirms a completed transaction processed securely via QuickBooks. For questions about this invoice, contact us using the details above.',
          pageLeft, footerY + 24, { width: contentW });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
        .text('Thank you for your business!', pageLeft, footerY + 56, { width: contentW, align: 'center', lineBreak: false });
      doc.fillColor(MUTE).font('Helvetica').fontSize(8)
        .text(`${co.name}  ·  ${co.phone}  ·  ${co.email}`, pageLeft, footerY + 72, { width: contentW, align: 'center', lineBreak: false });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function invoiceFileName(invoice) {
  const safe = String(invoice.invoice_number || `invoice-${invoice._id}`).replace(/[^a-z0-9_\-]/gi, '_');
  return `${safe}.pdf`;
}

/** Generate the PDF, write it to disk, and persist the path on the Invoice. */
async function generateAndStore(invoice) {
  const data = await gatherInvoiceData(invoice);
  const buffer = await renderPdf(data);

  const dir = path.join(INVOICE_ROOT, String(invoice.client_id));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, invoiceFileName(invoice));
  fs.writeFileSync(filePath, buffer);

  invoice.file_path = filePath;
  invoice.pdf_generated_at = new Date();
  await invoice.save();
  return { filePath, buffer };
}

/**
 * Return an on-disk PDF path for the invoice, generating (or regenerating) it
 * if the stored file is missing. Safe to call repeatedly — the file is created
 * only once and reused thereafter.
 * @param {number|string} invoiceId
 * @returns {Promise<{invoice, filePath, fileName}>}
 */
async function ensureInvoiceFile(invoiceId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });

  if (invoice.file_path && fs.existsSync(invoice.file_path)) {
    return { invoice, filePath: invoice.file_path, fileName: invoiceFileName(invoice) };
  }
  const { filePath } = await generateAndStore(invoice);
  return { invoice, filePath, fileName: invoiceFileName(invoice) };
}

module.exports = {
  getCompanyInfo,
  gatherInvoiceData,
  renderPdf,
  generateAndStore,
  ensureInvoiceFile,
  invoiceFileName,
};
