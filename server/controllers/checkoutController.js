const qb = require('../services/quickbooks');
const {
  Order,
  Payment,
  Invoice,
  Notification,
  ActivityLog,
  OrderStatusHistory,
  Client,
  toRow
} = require('../models');

const LARGE_PAYMENT_THRESHOLD = () => Number(process.env.QUICKBOOKS_LARGE_PAYMENT_THRESHOLD || 1000);

// Demo payment simulation — lets the full checkout flow be exercised without
// real QuickBooks credentials. Active ONLY when PAYMENTS_DEMO_MODE=true and the
// environment is not production, so it can never fake a real (production) charge.
const DEMO_MODE = () =>
  process.env.PAYMENTS_DEMO_MODE === 'true' &&
  (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox').toLowerCase() !== 'production';

function validCardInput(card) {
  if (!card || typeof card !== 'object') return 'Card details are required';
  const number = String(card.number || '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(number)) return 'Invalid card number';
  const expMonth = String(card.expMonth || '').padStart(2, '0');
  const expYear = String(card.expYear || '');
  if (!/^(0[1-9]|1[0-2])$/.test(expMonth)) return 'Invalid expiry month';
  if (!/^\d{4}$/.test(expYear)) return 'Invalid expiry year (YYYY)';
  const now = new Date();
  if (Number(expYear) < now.getFullYear() ||
     (Number(expYear) === now.getFullYear() && Number(expMonth) < now.getMonth() + 1)) {
    return 'Card is expired';
  }
  if (!/^\d{3,4}$/.test(String(card.cvc || ''))) return 'Invalid CVC';
  if (!String(card.name || '').trim()) return 'Cardholder name is required';
  return null;
}

/**
 * POST /api/payments/quickbooks/charge   (client)
 * Body: { order_id, card: { number, expMonth, expYear, cvc, name, address? } }
 *
 * Amount is always derived server-side from the order. Card data is
 * tokenized with QuickBooks and never persisted.
 */
exports.chargeOrder = async (req, res) => {
  const { order_id, card } = req.body;
  if (!order_id) return res.status(400).json({ error: 'order_id is required' });

  const cardError = validCardInput(card);
  if (cardError) return res.status(400).json({ error: cardError });

  try {
    const order = await Order.findOne({ _id: order_id, client_id: req.user.id })
      .populate('service_id', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'cancelled')
      return res.status(400).json({ error: 'Cancelled orders cannot be paid' });
    if (order.payment_status === 'paid')
      return res.status(400).json({ error: 'This order is already paid' });
    if (order.payment_status === 'processing')
      return res.status(409).json({ error: 'A payment for this order is already processing' });

    const amount = Number(order.total_amount || 0);
    if (!(amount > 0)) return res.status(400).json({ error: 'Order amount is invalid' });
    const amountStr = amount.toFixed(2);

    // Create the local payment record first (audit trail, idempotency guard)
    const payment = new Payment({
      order_id: order.id,
      client_id: req.user.id,
      amount,
      currency: order.currency || 'USD',
      method: 'card',
      gateway: 'quickbooks',
      status: 'processing'
    });
    await payment.save();

    order.payment_status = 'processing';
    order.updated_at = new Date();
    await order.save();

    let charge;
    try {
      const cardNumber = String(card.number).replace(/[\s-]/g, '');
      if (DEMO_MODE()) {
        // Simulated success — no external gateway call, no card number stored.
        charge = {
          id: `DEMO-${Date.now()}`,
          status: 'CAPTURED',
          card: {
            number: cardNumber.slice(-4),
            cardType: cardNumber[0] === '4' ? 'Visa' : cardNumber[0] === '5' ? 'Mastercard' : 'Card',
          },
        };
      } else {
        const token = await qb.tokenizeCard({
          number: cardNumber,
          expMonth: String(card.expMonth).padStart(2, '0'),
          expYear: String(card.expYear),
          cvc: String(card.cvc),
          name: String(card.name).trim(),
          address: card.address || undefined
        });

        charge = await qb.createCharge({
          amountStr,
          currency: order.currency || 'USD',
          token,
          description: `Order ${order.order_number}${order.service_id ? ` — ${order.service_id.name}` : ''}`
        });
      }
    } catch (gatewayErr) {
      payment.status = 'failed';
      payment.failure_reason = gatewayErr.message;
      payment.updated_at = new Date();
      await payment.save();

      order.payment_status = 'failed';
      order.updated_at = new Date();
      await order.save();

      const failNotif = new Notification({
        client_id: req.user.id,
        type: 'payment',
        title: 'Payment failed',
        body: `Your payment of $${amountStr} for order ${order.order_number} could not be processed. ${gatewayErr.message}`
      });
      await failNotif.save();

      const failLog = new ActivityLog({
        admin_id: null,
        action: 'payment_failed',
        entity_type: 'payment',
        entity_id: payment.id,
        meta: { order_id: order.id, amount, reason: gatewayErr.message }
      });
      await failLog.save();

      const statusCode = gatewayErr.status === 503 ? 503 : 402;
      return res.status(statusCode).json({ error: `Payment failed: ${gatewayErr.message}`, payment_id: payment.id });
    }

    // Never trust anything but the gateway's own response
    const paid = ['CAPTURED', 'SETTLED', 'AUTHORIZED'].includes(charge.status);

    payment.qb_payment_id = charge.id ? String(charge.id) : null;
    payment.transaction_id = charge.id ? String(charge.id) : null;
    payment.card_last4 = charge.card?.number ? String(charge.card.number).slice(-4) : null;
    payment.card_type = charge.card?.cardType || null;
    payment.status = paid ? 'completed' : 'failed';
    if (!paid) payment.failure_reason = `Gateway status: ${charge.status}`;
    payment.updated_at = new Date();

    if (paid) {
      // Issue a paid invoice for the order
      const invoice = new Invoice({
        client_id: req.user.id,
        order_id: order.id,
        invoice_number: `INV-${order.order_number}-${Date.now().toString().slice(-6)}`,
        subtotal: amount,
        tax: 0,
        total: amount,
        status: 'paid',
        paid_at: new Date()
      });
      await invoice.save();
      payment.invoice_id = invoice.id;
    }
    await payment.save();

    order.payment_status = paid ? 'paid' : 'failed';
    order.transaction_id = payment.transaction_id;
    order.qb_payment_id = payment.qb_payment_id;
    // Once paid, move a still-pending order into fulfillment so it no longer
    // reads as "Pending" in the orders lists.
    const advancedToProcessing = paid && order.status === 'pending';
    if (advancedToProcessing) order.status = 'processing';
    order.updated_at = new Date();
    await order.save();

    if (advancedToProcessing) {
      OrderStatusHistory.create({
        order_id: order.id,
        status: 'processing',
        changed_by: 'system:payment',
        note: 'Payment received — order moved to processing',
      }).catch(err => console.error('order status history failed:', err.message));
    }

    const notif = new Notification({
      client_id: req.user.id,
      type: 'payment',
      title: paid ? 'Payment successful' : 'Payment failed',
      body: paid
        ? `Your payment of $${amountStr} for order ${order.order_number} was successful.`
        : `Your payment of $${amountStr} for order ${order.order_number} was not completed (${charge.status}).`
    });
    await notif.save();

    const log = new ActivityLog({
      admin_id: null,
      action: paid ? 'payment_completed' : 'payment_failed',
      entity_type: 'payment',
      entity_id: payment.id,
      meta: { order_id: order.id, amount, qb_payment_id: payment.qb_payment_id }
    });
    await log.save();

    if (paid && amount >= LARGE_PAYMENT_THRESHOLD()) {
      const largeLog = new ActivityLog({
        admin_id: null,
        action: 'large_payment_received',
        entity_type: 'payment',
        entity_id: payment.id,
        meta: { order_id: order.id, amount }
      });
      await largeLog.save();
    }

    if (!paid) {
      return res.status(402).json({ error: `Payment was not completed (status: ${charge.status})`, payment_id: payment.id });
    }

    res.status(201).json({
      message: 'Payment successful',
      payment_id: payment.id,
      invoice_id: payment.invoice_id,
      transaction_id: payment.transaction_id,
      status: payment.status
    });
  } catch (err) {
    console.error('chargeOrder error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Payment processing failed' });
  }
};

/**
 * GET /api/payments/:id/receipt   (client)
 * Returns full receipt data for a completed/refunded payment owned by the client.
 */
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, client_id: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const [order, invoice, client] = await Promise.all([
      payment.order_id ? Order.findById(payment.order_id).populate('service_id', 'name') : null,
      payment.invoice_id ? Invoice.findById(payment.invoice_id) : null,
      Client.findById(req.user.id)
    ]);

    const row = toRow(payment);
    res.json({
      receipt: {
        ...row,
        order_number: order ? order.order_number : null,
        service_name: order && order.service_id ? order.service_id.name : null,
        invoice_number: invoice ? invoice.invoice_number : null,
        invoice_total: invoice ? invoice.total : null,
        client_name: client ? `${client.first_name} ${client.last_name}` : null,
        client_email: client ? client.email : null,
        company_name: client ? client.company_name : null
      }
    });
  } catch (err) {
    console.error('getReceipt error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};
