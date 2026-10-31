'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ToastContextValue {
  addToast: (type: ToastType, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alertModal: (message: string, title?: string, type?: ToastType) => Promise<void>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    case 'error':
      return <XCircle size={18} className="text-rose-500" />;
    case 'warning':
      return <AlertTriangle size={18} className="text-amber-500" />;
    case 'info':
    default:
      return <Info size={18} className="text-sky-500" />;
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // État de la boîte de confirmation modale in-app
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  // État de l'alerte modale in-app
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ToastType;
    resolve: () => void;
  } | null>(null);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve: (val: boolean) => {
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  }, []);

  const alertModal = useCallback((message: string, title: string = 'Notification', type: ToastType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        resolve: () => {
          setAlertState(null);
          resolve();
        },
      });
    });
  }, []);

  // Intercepter window.alert pour qu'aucun popup natif du navigateur n'apparaisse en haut de l'écran
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg?: any) => {
        const text = String(msg ?? '');
        // Afficher un toast élégant intégré directement dans la page
        const isError = text.toLowerCase().includes('erreur') || text.toLowerCase().includes('introuvable') || text.toLowerCase().includes('échec');
        addToast(isError ? 'error' : 'info', isError ? 'Information' : 'Notification', text);
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [addToast]);

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast, confirm, alertModal }}>
      {children}

      {/* Conteneur de Toasts in-app */}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className="toast-icon" aria-hidden="true">
              <ToastIcon type={t.type} />
            </span>
            <div className="toast-content">
              <p className="toast-title">{t.title}</p>
              {t.message && <p className="toast-message">{t.message}</p>}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Fermer la notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Boîte Modale In-App de Confirmation */}
      {confirmState?.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 440,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                background: confirmState.options.type === 'danger' ? '#fef2f2' : '#fef3c7',
                color: confirmState.options.type === 'danger' ? '#dc2626' : '#d97706',
                padding: 10,
                borderRadius: 12,
                flexShrink: 0,
              }}>
                {confirmState.options.type === 'danger' ? <XCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                  {confirmState.options.title || 'Confirmation requise'}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                  {confirmState.options.message}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {confirmState.options.cancelText || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: confirmState.options.type === 'danger' ? '#dc2626' : '#2563eb',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                autoFocus
              >
                {confirmState.options.confirmText || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boîte Modale In-App d'Alerte */}
      {alertState?.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 420,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alertState.type === 'error' ? '#fef2f2' : alertState.type === 'success' ? '#f0fdf4' : '#eff6ff',
              color: alertState.type === 'error' ? '#dc2626' : alertState.type === 'success' ? '#16a34a' : '#2563eb',
            }}>
              {alertState.type === 'error' ? <XCircle size={28} /> : alertState.type === 'success' ? <CheckCircle2 size={28} /> : <Info size={28} />}
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {alertState.title}
            </h3>
            <p style={{ margin: '0 0 22px 0', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              {alertState.message}
            </p>

            <button
              type="button"
              onClick={() => alertState.resolve()}
              style={{
                width: '100%',
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              autoFocus
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return ctx;
}

export function useConfirm() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans un ToastProvider');
  return ctx.confirm;
}
