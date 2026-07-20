import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, apiUrl, formatDate, formatCurrency, statusBadge } from '../../utils/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const navigate = useNavigate();

  const loadInvoices = async () => {
    try {
      const data = await api.get('/invoices');
      setInvoices(data.invoices || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePay = (invoice) => {
    if (invoice?.order_id) {
      navigate(`/client-portal/checkout/${invoice.order_id}`);
      return;
    }
    setAlertType('info');
    setAlertMsg('This invoice is not linked to an order. Please contact us at (510) 962-7300 or accounting@bayareaaccountingsolutions.com to arrange payment.');
  };

  const unpaidCount = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length;

  // Invoice PDF actions. Downloads/views ride the httpOnly auth cookie on a
  // top-level navigation, so ownership is verified server-side before serving.
  const invoiceHref = (inv, inline) => apiUrl(`/invoices/${inv.id}/download${inline ? '?inline=1' : ''}`);
  const viewInvoice = (inv) => window.open(invoiceHref(inv, true), '_blank', 'noopener');
  const printInvoice = (inv) => {
    const w = window.open(invoiceHref(inv, true), '_blank', 'noopener');
    if (w) w.addEventListener('load', () => { try { w.focus(); w.print(); } catch { /* viewer handles print */ } });
  };
  const canPdf = (inv) => inv.status === 'paid';

  return (
    <PortalLayout title="Invoices" subtitle="Your billing history">
      <div className="page-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Invoices</h1>
        {unpaidCount > 0 && (
          <div id="invoice-summary" style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>
            {unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {alertMsg && (
        <div className={`alert alert-${alertType}`} style={{ marginBottom: '20px' }}>
          {alertMsg}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : !invoices.length ? (
          <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0' }}>No invoices yet</h4>
            <p style={{ color: 'var(--td)', fontSize: '14px' }}>Invoices will appear here after your orders are processed.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ color: 'var(--td)' }}>{inv.order_number || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>{statusBadge(inv.status)}</span>
                    </td>
                    <td style={{ color: 'var(--td)' }}>{formatDate(inv.due_date)}</td>
                    <td style={{ color: 'var(--td)' }}>{formatDate(inv.created_at)}</td>
                    <td>
                      {['sent', 'overdue'].includes(inv.status) ? (
                        <button
                          className="btn-p"
                          onClick={() => handlePay(inv)}
                          style={{ fontSize: '13px', padding: '7px 14px', cursor: 'pointer' }}
                        >
                          Pay Now
                        </button>
                      ) : canPdf(inv) ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="btn-g" onClick={() => viewInvoice(inv)} title="View invoice"
                            style={{ fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }}>View</button>
                          <a className="btn-g" href={invoiceHref(inv, false)} download title="Download PDF"
                            style={{ fontSize: '12px', padding: '6px 10px', display: 'inline-flex' }}>Download</a>
                          <button className="btn-g" onClick={() => printInvoice(inv)} title="Print invoice"
                            style={{ fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }}>Print</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--td)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
