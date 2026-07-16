import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatCurrency } from '../../utils/api';

const SERVICES = [
  { id: 1, name: 'LLC Registration', description: 'Complete formation of a Limited Liability Company.', price: 199, state_fee: 100 },
  { id: 2, name: 'Corporation Formation', description: 'Incorporation of a C-Corp or S-Corp.', price: 249, state_fee: 150 },
  { id: 3, name: 'Annual Report Filing', description: 'State-required yearly compliance filing.', price: 99, state_fee: 50 },
  { id: 4, name: 'BOI Filing', description: 'Beneficial Ownership Information report.', price: 75, state_fee: 0 },
  { id: 5, name: 'Registered Agent Service', description: 'One year of registered agent representation.', price: 150, state_fee: 0 },
  { id: 6, name: 'EIN (Tax ID) Acquisition', description: 'Obtaining employer identification number.', price: 50, state_fee: 0 },
  { id: 7, name: 'Operating Agreement Drafting', description: 'Custom corporate governing document.', price: 120, state_fee: 0 },
  { id: 8, name: 'Bookkeeping Setup', description: 'Initial accounting systems installation.', price: 299, state_fee: 0 },
  { id: 9, name: 'Monthly Bookkeeping', description: 'Ongoing monthly accounts management.', price: 199, state_fee: 0 },
  { id: 10, name: 'Corporate Tax Return', description: 'Annual federal and state tax filing.', price: 499, state_fee: 0 },
  { id: 11, name: 'Sales Tax Registration', description: 'Sales and use tax permit acquisition.', price: 99, state_fee: 10 },
  { id: 12, name: 'Payroll Setup', description: 'Employee payments processing deployment.', price: 150, state_fee: 0 },
  { id: 13, name: 'Tax Consultation', description: 'One hour advisory meeting with CPA.', price: 150, state_fee: 0 },
  { id: 14, name: 'Dissolution Filing', description: 'Formal closure of business entity.', price: 175, state_fee: 60 }
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function NewOrder() {
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [state, setState] = useState('CA');
  const [notes, setNotes] = useState('');
  const [serviceErr, setServiceErr] = useState('');
  const [stateErr, setStateErr] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const selectedService = SERVICES.find(s => s.id === selectedServiceId);

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
            
            <div className="service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '4px' }}>
              {SERVICES.map(s => (
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
                  <div className="service-name" style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{s.name}</div>
                  <div className="service-desc" style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, marginBottom: '10px' }}>{s.description}</div>
                  <div className="service-price" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(s.price)}</div>
                  
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
                  <span style={{ fontWeight: 700 }}>{formatCurrency(selectedService.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--td)' }}>
                  <span>State filing fee (paid separately to state)</span>
                  <span>{formatCurrency(selectedService.state_fee)} (est.)</span>
                </div>
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
