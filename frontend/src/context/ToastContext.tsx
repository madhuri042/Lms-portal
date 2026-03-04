import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type PopupType = 'success' | 'error';

type PopupState = {
  message: string;
  type: PopupType;
} | null;

type ToastContextValue = {
  showToast: (message: string, type?: PopupType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const POPUP_AUTO_CLOSE_MS = 5000;

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popup, setPopup] = useState<PopupState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: PopupType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPopup({ message, type });
    timerRef.current = setTimeout(() => {
      setPopup(null);
      timerRef.current = null;
    }, POPUP_AUTO_CLOSE_MS);
  }, []);

  const closePopup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPopup(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {popup && (
        <div
          className="custom-popup-backdrop"
          onClick={closePopup}
          role="dialog"
          aria-modal
          aria-labelledby="custom-popup-message"
        >
          <div
            className={`custom-popup custom-popup--${popup.type}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="custom-popup__icon-wrap">
              {popup.type === 'success' && (
                <svg className="custom-popup__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {popup.type === 'error' && (
                <svg className="custom-popup__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <p id="custom-popup-message" className="custom-popup__message">{popup.message}</p>
            <button
              type="button"
              className="custom-popup__btn"
              onClick={closePopup}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
