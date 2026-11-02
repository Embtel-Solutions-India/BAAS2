import { useEffect, useMemo, useState } from 'react';
import { futureSlotsByDate, getAvailability } from '../../utils/consultationApi';

const REFRESH_MS = 10 * 60 * 1000; // the booking guide asks for a refresh every 10 minutes

// Holds the latest list of free times. It loads when the page opens, refreshes every 10 minutes, and `replace`
// swaps in the `days` returned by a booking, cancel or reschedule so the calendar is right straight away.
export function useConsultationSlots(enabled = true) {
  const [state, setState] = useState({ days: null, timezone: 'America/Los_Angeles', error: '' });
  const [nonce, setNonce] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () => getAvailability().then((r) => {
      if (!alive) return;
      if (r.success && Array.isArray(r.days)) setState({ days: r.days, timezone: r.timezone || 'America/Los_Angeles', error: '' });
      else setState((s) => ({ ...s, error: r.message || 'We could not load available times.' }));
    });
    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(refresh); };
  }, [enabled, nonce]);

  // Times pass: re-check once a minute so a slot disappears from the page when it starts.
  useEffect(() => {
    if (!enabled) return undefined;
    const t = setInterval(() => setMinute((m) => m + 1), 60000);
    return () => clearInterval(t);
  }, [enabled]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const byDate = useMemo(() => futureSlotsByDate(state.days), [state.days, minute]);
  return {
    byDate,
    availableDates: useMemo(() => new Set(byDate.keys()), [byDate]),
    lastDate: useMemo(() => [...byDate.keys()].sort().pop() || '', [byDate]),
    timezone: state.timezone,
    loading: enabled && state.days === null && !state.error,
    error: state.days === null ? state.error : '',
    replace: (days) => { if (Array.isArray(days)) setState((s) => ({ ...s, days, error: '' })); },
    reload: () => { setState((s) => ({ ...s, error: '' })); setNonce((n) => n + 1); },
  };
}
