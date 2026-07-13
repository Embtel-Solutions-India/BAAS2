const { Payment, toRow } = require('../models');

exports.createIntent = async (req, res) => {
  // Stripe payment intent stub — implement when Stripe keys are provided
  res.status(501).json({ error: 'Payment gateway not configured yet. Contact support.' });
};

exports.listPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ client_id: req.user.id })
      .populate('invoice_id', 'invoice_number')
      .sort({ created_at: -1 });

    const rows = payments.map(p => {
      const row = toRow(p);
      row.invoice_number = p.invoice_id ? p.invoice_id.invoice_number : null;
      row.invoice_id = p.invoice_id ? p.invoice_id.id : null;
      return row;
    });

    res.json({ payments: rows });
  } catch (err) {
    console.error('listPayments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};
