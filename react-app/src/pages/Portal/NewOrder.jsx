import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatCurrency } from '../../utils/api';

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function NewOrder() {
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [state, setState] = useState('CA');
  const [notes, setNotes] = useState('');
  const [serviceErr, setServiceErr] = useState('');
  const [stateErr, setStateErr] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Catalog is admin-managed — load only currently available services.
  useEffect(() => {
    let live = true;
    api.get('/services')
      .then(data => { if (live) setServices(data.services || []); })
      .catch(() => { if (live) setServices([]); })
      .finally(() => { if (live) setServicesLoading(false); });
    return () => { live = false; };
  }, []);

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServiceErr('');
    setStateErr('');
    setAlertMsg('');
    setAlertType('');

    let valid = true;
    if (!selectedServiceId) {
      setServiceErr('Please select a service.');
      valid = false;
    }
    if (!state) {
      setStateErr('Please select a state.');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await api.post('/orders', {
        service_id: selectedServiceId,
        state,
        notes: notes.trim() || undefined
      });
      setAlertType('success');
      setAlertMsg(`Order ${data.order_number} placed! Redirecting to checkout…`);
      setTimeout(() => {
        navigate(`/client-portal/checkout/${data.order_id}`);
      }, 1000);
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <PortalLayout title="New Order" subtitle="Select a service to get started">
      <div className="page-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>New Order</h1>
        <Link to="/client-portal/orders" className="btn-g">← Back to Orders</Link>
      </div>

      <div className="form-wrap" style={{ maxWidth: '100%' }}>
        {alertMsg && (
          <div className={`alert alert-${alertType}`} style={{ marginBottom: '20px' }}>
            {alertMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Service Selection */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '6px', fontSize: '16px', fontWeight: 700 }}>Select a Service</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--td)' }}>Choose the service you need and we'll handle the rest.</p>
            
            {servicesLoading ? (
              <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : !services.length ? (
              <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0' }}>No services available yet</h4>
                <p style={{ color: 'var(--td)', fontSize: '14px', margin: 0 }}>Please check back soon — our team is updating the service catalog.</p>
              </div>
            ) : (
              <div className="service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '4px' }}>
                {services.map(s => (
                  <div
                    key={s.id}
                    className={`service-option ${selectedServiceId === s.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setServiceErr('');
                    }}
                    style={{
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'all .18s',
                      position: 'relative',
                      borderColor: selectedServiceId === s.id ? 'var(--accent)' : 'var(--border)',
                      background: selectedServiceId === s.id ? 'rgba(212,0,31,.04)' : 'transparent'
                    }}
                  >
                    {s.category && <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--td)', marginBottom: '6px' }}>{s.category}</div>}
                    <div className="service-name" style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{s.name}</div>
                    <div className="service-desc" style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, marginBottom: '10px' }}>{s.description}</div>
                    <div className="service-price" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {s.discount_price != null ? (
                        <>
                          {formatCurrency(s.discount_price)}
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--td)', textDecoration: 'line-through' }}>{formatCurrency(s.price)}</span>
                        </>
                      ) : formatCurrency(s.price)}
                    </div>

                    {selectedServiceId === s.id && (
                      <div className="check-mark" style={{
                        position: 'absolute', top: '14px', right: '14px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'var(--accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {serviceErr && <div className="form-error visible" style={{ marginTop: '8px' }}>{serviceErr}</div>}
          </div>

          {/* Details & Submit */}
          <div className="card">
            <h3 style={{ marginBottom: '18px', fontSize: '16px', fontWeight: 700 }}>Order Details</h3>

            <div className="us-states" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label htmlFor="state">Filing State <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  id="state"
                  className={`form-control ${stateErr ? 'error' : ''}`}
                  value={state}
                  onChange={e => {
                    setState(e.target.value);
                    setStateErr('');
                  }}
                  required
                >
                  <option value="">Select state…</option>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                {stateErr && <div className="form-error visible">{stateErr}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes <span style={{ fontWeight: 400, color: 'var(--td)' }}>(optional)</span></label>
              <textarea
                id="notes"
                className="form-control"
                rows={4}
                placeholder="Company name, special instructions, or any other details…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {selectedService && (
              <div id="order-summary" style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: '#f9f9fb', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--td)', marginBottom: '10px' }}>ORDER SUMMARY</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '15px' }}>
                  <span>{selectedService.name}</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(selectedService.discount_price != null ? selectedService.discount_price : selectedService.price)}</span>
                </div>
                {(selectedService.state_fee || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--td)' }}>
                    <span>State filing fee (paid separately to state)</span>
                    <span>{formatCurrency(selectedService.state_fee)} (est.)</span>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
