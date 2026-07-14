import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatCurrency, formatDate, statusBadge } from '../../utils/api';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export default function Checkout() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [billing, setBilling] = useState({ name: '', email: '', streetAddress: '', city: '', region: '', postalCode: '' });
  const [card, setCard] = useState({ number: '', name: '', expMonth: '', expYear: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState('');
  const [result, setResult] = useState(null);   // { payment_id, transaction_id, invoice_id }
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [orderRes, meRes] = await Promise.all([
          api.get(`/orders/${orderId}`),
          api.get('/auth/me').catch(() => null),
        ]);
        if (!active) return;
        setOrder(orderRes.order);
        const u = meRes?.user;
        if (u) {
          setBilling(b => ({
            ...b,
            name: [u.first_name, u.last_name].filter(Boolean).join(' ') || b.name,
            email: u.email || b.email,
            region: orderRes.order?.state || b.region,
          }));
          setCard(c => ({ ...c, name: [u.first_name, u.last_name].filter(Boolean).join(' ') || c.name }));
        }
      } catch (err) {
        if (active) setLoadError(err.message || 'Failed to load order');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [orderId]);

  const amount = Number(order?.total_amount || 0);
  const currency = order?.currency || 'USD';

  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => String(base + i));
  }, []);

  const setB = (k, v) => setBilling(s => ({ ...s, [k]: v }));
  const setC = (k, v) => setCard(s => ({ ...s, [k]: v }));

  const validate = () => {
    const e = {};
    if (!billing.name.trim()) e.name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(billing.email.trim())) e.email = 'Valid email required';
    if (!billing.streetAddress.trim()) e.streetAddress = 'Required';
    if (!billing.city.trim()) e.city = 'Required';
    if (!billing.region.trim()) e.region = 'Required';
    if (!/^\d{5}(-\d{4})?$/.test(billing.postalCode.trim())) e.postalCode = 'Valid ZIP required';

    const num = card.number.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(num)) e.number = 'Enter a valid card number';
    if (!card.name.trim()) e.cardName = 'Required';
    if (!/^(0[1-9]|1[0-2])$/.test(card.expMonth)) e.expMonth = 'MM';
    if (!/^\d{4}$/.test(card.expYear)) e.expYear = 'YYYY';
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = 'CVC';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async (ev) => {
    ev.preventDefault();
    setPayError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/payments/quickbooks/charge', {
        order_id: order.id,
        card: {
          number: card.number.replace(/[\s-]/g, ''),
          expMonth: card.expMonth,
          expYear: card.expYear,
          cvc: card.cvc,
          name: card.name.trim(),
          address: {
            streetAddress: billing.streetAddress.trim(),
            city: billing.city.trim(),
            region: billing.region.trim().toUpperCase(),
            country: 'US',
            postalCode: billing.postalCode.trim(),
          },
        },
      });
      setResult(res);
      if (res.payment_id) {
        api.get(`/payments/${res.payment_id}/receipt`).then(r => setReceipt(r.receipt)).catch(() => {});
      }
    } catch (err) {
      setPayError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Checkout">
        <div className="empty-state" style={{ padding: '80px 24px' }}><div className="spinner" /></div>
      </PortalLayout>
    );
  }

  if (loadError || !order) {
    return (
      <PortalLayout title="Checkout">
        <div className="empty-state" style={{ padding: '60px' }}>
          <div className="alert alert-danger">{loadError || 'Order not found'}</div>
          <Link to="/client-portal/orders" className="btn-g mt-16">← Back to Orders</Link>
        </div>
      </PortalLayout>
    );
  }

  // ── Success confirmation ─────────────────────────────────────────
  if (result) {
    return (
      <PortalLayout title="Payment Confirmation" subtitle="Thank you for your payment">
        <div className="card-lg checkout-receipt" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="checkout-check" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="30" height="30" fill="none" stroke="var(--success)" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ marginBottom: '6px' }}>Payment Successful</h2>
            <p style={{ color: 'var(--td)', fontSize: '15px' }}>A receipt has been generated for order {order.order_number}.</p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
            {[
              ['Order #', order.order_number],
              ['Amount paid', formatCurrency(amount)],
              ['Transaction ID', result.transaction_id || receipt?.transaction_id || '—'],
              ['Invoice #', receipt?.invoice_number || '—'],
              ['Paid on', formatDate(receipt?.created_at || new Date().toISOString())],
              ['Billed to', billing.name],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--td)' }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="checkout-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button className="btn-pl" onClick={() => window.print()} style={{ flex: '1 1 180px', justifyContent: 'center' }}>
              Download / Print receipt
            </button>
            <Link to={`/client-portal/orders/${order.id}`} className="btn-ol" style={{ flex: '1 1 140px', justifyContent: 'center' }}>View order</Link>
            <Link to="/client-portal/invoices" className="btn-g" style={{ flex: '1 1 120px', justifyContent: 'center' }}>Invoices</Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // ── Already paid / not payable ───────────────────────────────────
  if (order.payment_status === 'paid') {
    return (
      <PortalLayout title="Checkout">
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <span className="badge badge-paid" style={{ marginBottom: '12px' }}>{statusBadge('paid')}</span>
          <h3 style={{ margin: '8px 0' }}>This order is already paid</h3>
          <p style={{ color: 'var(--td)', fontSize: '14px', marginBottom: '20px' }}>Order {order.order_number} has been paid in full.</p>
          <Link to={`/client-portal/orders/${order.id}`} className="btn-pl">View order</Link>
        </div>
      </PortalLayout>
    );
  }
  if (order.status === 'cancelled') {
    return (
      <PortalLayout title="Checkout">
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <h3 style={{ margin: '8px 0' }}>This order was cancelled</h3>
          <p style={{ color: 'var(--td)', fontSize: '14px', marginBottom: '20px' }}>Cancelled orders can't be paid.</p>
          <Link to="/client-portal/orders" className="btn-g">← Back to Orders</Link>
        </div>
      </PortalLayout>
    );
  }

  const fieldErr = (k) => errors[k] ? <div className="form-error visible">{errors[k]}</div> : null;

  return (
    <PortalLayout title="Checkout" subtitle={`Pay for order ${order.order_number}`}>
      <form onSubmit={handlePay} className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>
        {/* Left: billing + card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {payError && <div className="alert alert-danger" style={{ margin: 0 }}>{payError}</div>}

          <div className="card">
            <h4 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>Billing information</h4>
            <div className="form-group">
              <label>Full name</label>
              <input className={`form-control ${errors.name ? 'error' : ''}`} value={billing.name} onChange={e => setB('name', e.target.value)} placeholder="Jane Doe" />
              {fieldErr('name')}
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" className={`form-control ${errors.email ? 'error' : ''}`} value={billing.email} onChange={e => setB('email', e.target.value)} placeholder="you@company.com" />
              {fieldErr('email')}
            </div>
            <div className="form-group">
              <label>Street address</label>
              <input className={`form-control ${errors.streetAddress ? 'error' : ''}`} value={billing.streetAddress} onChange={e => setB('streetAddress', e.target.value)} placeholder="123 Market St" />
              {fieldErr('streetAddress')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>City</label>
                <input className={`form-control ${errors.city ? 'error' : ''}`} value={billing.city} onChange={e => setB('city', e.target.value)} placeholder="Fremont" />
                {fieldErr('city')}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>State</label>
                <select className={`form-control ${errors.region ? 'error' : ''}`} value={billing.region} onChange={e => setB('region', e.target.value)}>
                  <option value="">—</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErr('region')}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>ZIP</label>
                <input className={`form-control ${errors.postalCode ? 'error' : ''}`} value={billing.postalCode} onChange={e => setB('postalCode', e.target.value)} placeholder="94538" inputMode="numeric" />
                {fieldErr('postalCode')}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Card details</h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--td)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Secured by QuickBooks
              </span>
            </div>
            <div className="form-group">
              <label>Card number</label>
              <input className={`form-control ${errors.number ? 'error' : ''}`} value={card.number} onChange={e => setC('number', e.target.value)} placeholder="4111 1111 1111 1111" inputMode="numeric" autoComplete="cc-number" />
              {fieldErr('number')}
            </div>
            <div className="form-group">
              <label>Name on card</label>
              <input className={`form-control ${errors.cardName ? 'error' : ''}`} value={card.name} onChange={e => setC('name', e.target.value)} placeholder="Jane Doe" autoComplete="cc-name" />
              {fieldErr('cardName')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Exp. month</label>
                <select className={`form-control ${errors.expMonth ? 'error' : ''}`} value={card.expMonth} onChange={e => setC('expMonth', e.target.value)} autoComplete="cc-exp-month">
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {fieldErr('expMonth')}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Exp. year</label>
                <select className={`form-control ${errors.expYear ? 'error' : ''}`} value={card.expYear} onChange={e => setC('expYear', e.target.value)} autoComplete="cc-exp-year">
                  <option value="">YYYY</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {fieldErr('expYear')}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>CVC</label>
                <input className={`form-control ${errors.cvc ? 'error' : ''}`} value={card.cvc} onChange={e => setC('cvc', e.target.value)} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                {fieldErr('cvc')}
              </div>
            </div>
            <p className="form-hint" style={{ marginTop: '12px' }}>Your card is tokenized by QuickBooks and never stored on our servers.</p>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="card" style={{ position: 'sticky', top: '88px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>Order summary</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
            <span style={{ color: 'var(--td)' }}>{order.service_name || 'Service'}</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--td)' }}>Subtotal</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
            <span style={{ color: 'var(--td)' }}>Tax</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: '17px', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <span>Total</span>
            <span className="text-accent">{formatCurrency(amount)} {currency}</span>
          </div>

          <button type="submit" className="btn-pl" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
            {submitting ? 'Processing…' : `Pay ${formatCurrency(amount)}`}
          </button>
          <Link to={`/client-portal/orders/${order.id}`} className="btn-g" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Cancel</Link>
        </div>
      </form>
    </PortalLayout>
  );
}
