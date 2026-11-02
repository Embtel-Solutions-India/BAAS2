import { useEffect, useRef, useState } from 'react';
import { getAvailableDates, getAvailableSlots } from '../../utils/bookingApi';

// Both hooks fetch inside an effect and only ever set state from the response, tagged with the request it answers.
// A response for an older month/date (or an older retry) is ignored, so quick clicking can never show stale data.
const EMPTY_SET = new Set();

export function useMonthAvailability(month, enabled = true) {
  const [nonce, setNonce] = useState(0);
  const [res, setRes] = useState({ key: '', availableDates: EMPTY_SET, fullyBookedDates: EMPTY_SET, error: '' });
  const force = useRef(false);
  const key = `${month}#${nonce}`;

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const useForce = force.current;
    force.current = false;
    getAvailableDates(month, { force: useForce })
      .then((d) => { if (alive) setRes({ key, availableDates: new Set(d.availableDates), fullyBookedDates: new Set(d.fullyBookedDates || []), error: '' }); })
      .catch((err) => { if (alive) setRes((r) => ({ ...r, key, error: err.message })); });
    return () => { alive = false; };
  }, [month, enabled, nonce, key]);

  const loading = enabled && res.key !== key;
  return {
    availableDates: res.availableDates, fullyBookedDates: res.fullyBookedDates, loading,
    error: res.key === key ? res.error : '',
    reload: () => { force.current = true; setNonce((n) => n + 1); },
  };
}

export function useDaySlots(date, enabled = true) {
  const [nonce, setNonce] = useState(0);
  const [res, setRes] = useState({ key: '', slots: [], reason: '', dateAvailable: false, error: '' });
  const force = useRef(false);
  const key = `${date}#${nonce}`;

  useEffect(() => {
    if (!enabled || !date) return undefined;
    let alive = true;
    const useForce = force.current;
    force.current = false;
    getAvailableSlots(date, { force: useForce })
      .then((d) => { if (alive) setRes({ key, slots: d.slots, reason: d.reason || '', dateAvailable: d.dateAvailable, error: '' }); })
      .catch((err) => { if (alive) setRes({ key, slots: [], reason: '', dateAvailable: false, error: err.message }); });
    return () => { alive = false; };
  }, [date, enabled, nonce, key]);

  const active = enabled && !!date;
  const current = res.key === key;
  return {
    slots: active && current ? res.slots : [], reason: active && current ? res.reason : '', dateAvailable: active && current ? res.dateAvailable : false,
    loading: active && !current, error: active && current ? res.error : '',
    reload: () => { force.current = true; setNonce((n) => n + 1); },
  };
}
