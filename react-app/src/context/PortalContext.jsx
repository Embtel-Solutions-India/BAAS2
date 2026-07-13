import { useState, useCallback } from 'react';
import { PortalContext } from './PortalContextValue';

export function PortalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const open  = useCallback(() => { setIsOpen(true);  document.body.style.overflow = 'hidden'; }, []);
  const close = useCallback(() => { setIsOpen(false); document.body.style.overflow = ''; }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUploadedFiles([]);
    setActiveTab('login');
    close();
  }, [close]);

  return (
    <PortalContext.Provider value={{ isOpen, open, close, activeTab, setActiveTab, isLoggedIn, setIsLoggedIn, uploadedFiles, setUploadedFiles, logout }}>
      {children}
    </PortalContext.Provider>
  );
}

