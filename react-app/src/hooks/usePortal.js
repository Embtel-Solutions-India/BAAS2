import { useContext } from 'react';
import { PortalContext } from '../context/PortalContextValue';

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within a PortalProvider');
  return ctx;
}
