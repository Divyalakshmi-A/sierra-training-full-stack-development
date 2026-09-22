import { createContext, useCallback, useContext, useState } from 'react';
import { MessageStrip, Toast } from '@ui5/webcomponents-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);

  const showToast = useCallback((message, design = 'Negative') => {
    setToast({ message, design });
  }, []);

  const showError = useCallback((err) => {
    const message = err?.message || String(err);
    setToast({ message, design: 'Negative' });
  }, []);

  const showSuccess = useCallback((message) => {
    setToast({ message, design: 'Positive' });
  }, []);

  const showBanner = useCallback((message, design = 'Information') => {
    setBanner({ message, design });
  }, []);

  const clearBanner = useCallback(() => setBanner(null), []);

  return (
    <NotificationContext.Provider
      value={{ showToast, showError, showSuccess, showBanner, clearBanner }}
    >
      {banner && (
        <MessageStrip design={banner.design} onClose={clearBanner} style={{ margin: 0 }}>
          {banner.message}
        </MessageStrip>
      )}
      {toast && (
        <Toast open onClose={() => setToast(null)}>
          {toast.message}
        </Toast>
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
