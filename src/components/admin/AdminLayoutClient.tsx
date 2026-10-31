'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { Calendar, Bell, Shield, Menu, ArrowRightLeft, Package, Check, RefreshCw, ExternalLink } from 'lucide-react';
import styles from '../../app/admin/admin.module.css';
import { CurrencyProvider } from '@/context/CurrencyContext';
import CurrencySelector from '@/components/ui/CurrencySelector';
import { 
  getAdminNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  NotificationItem 
} from '@/actions/notifications';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications en direct
  const fetchNotifications = async () => {
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Erreur chargement notifications admin:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 20 secondes pour notifier immédiatement des versements des agents
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fermer la dropdown au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.lu) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setShowNotifications(false);
  };

  return (
    <CurrencyProvider storageKey="tangaly_admin_currency" initialCurrency="USD">
      <div className={styles.adminContainer}>
        {/* Sidebar navigation drawer */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile/Tablet Backdrop overlay */}
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content area */}
        <div className={styles.adminMain} suppressHydrationWarning={true}>
          <header className={styles.header}>
            <div className={styles.headerLeftWrap}>
              <button
                id="admin-menu-toggle"
                type="button"
                className={styles.menuToggle}
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir le menu d'administration"
                aria-expanded={sidebarOpen}
              >
                <Menu size={22} />
              </button>
              <div className={styles.headerLeft}>
                <h1>Bonjour, Administrateur !</h1>
                <p>Bienvenue dans le centre de contrôle.</p>
              </div>
            </div>

            <div className={styles.headerRight}>
              {/* Sélecteur de Devise pour l'Admin */}
              <CurrencySelector showRate={false} />

              <div className={`${styles.headerBadge} ${styles.badgeToday}`}>
                <Calendar size={16} /> Aujourd&apos;hui
              </div>

              {/* Cloche de Notifications avec Badge en Temps Réel */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div 
                  className={styles.bell} 
                  title="Notifications" 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) fetchNotifications();
                  }} 
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#ef4444',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 9999,
                      minWidth: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 0 0 2px white',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                {showNotifications && (
                  <div style={{
                    position: 'absolute', 
                    top: '120%', 
                    right: 0, 
                    width: 360, 
                    maxWidth: '90vw',
                    background: 'white', 
                    borderRadius: 12, 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                    border: '1px solid #e2e8f0', 
                    zIndex: 1000, 
                    overflow: 'hidden',
                  }}>
                    {/* Entête de la boîte notifications */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h4 style={{ margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 700 }}>Notifications</h4>
                        {unreadCount > 0 && (
                          <span style={{ 
                            background: '#fee2e2', 
                            color: '#dc2626', 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '1px 6px', 
                            borderRadius: 10 
                          }}>
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          type="button" 
                          onClick={handleMarkAllRead}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: 12, 
                            color: '#2563eb', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    {/* Liste des notifications */}
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '36px 16px', background: '#ffffff' }}>
                          <Bell size={28} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleItemClick(notif)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              background: notif.lu ? '#ffffff' : '#f0fdf4',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease',
                              display: 'flex',
                              gap: 12,
                              alignItems: 'flex-start',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = notif.lu ? '#f8fafc' : '#dcfce7'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = notif.lu ? '#ffffff' : '#f0fdf4'}
                          >
                            <div style={{
                              background: notif.type === 'VERSEMENT' ? '#f3e8ff' : '#eff6ff',
                              color: notif.type === 'VERSEMENT' ? '#7e22ce' : '#2563eb',
                              padding: 8,
                              borderRadius: 8,
                              flexShrink: 0,
                              marginTop: 2,
                            }}>
                              {notif.type === 'VERSEMENT' ? <ArrowRightLeft size={16} /> : <Package size={16} />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <strong style={{ fontSize: 13, color: '#0f172a' }}>{notif.sujet}</strong>
                                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{notif.dateFormatted}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                                {notif.message}
                              </p>
                              {notif.link && (
                                <Link 
                                  href={notif.link}
                                  onClick={() => setShowNotifications(false)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginTop: 6,
                                    fontSize: 11,
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                  }}
                                >
                                  Consulter l&apos;opération <ExternalLink size={11} />
                                </Link>
                              )}
                            </div>

                            {!notif.lu && (
                              <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#16a34a',
                                flexShrink: 0,
                                marginTop: 6,
                              }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pied de la boîte notifications */}
                    <div style={{ 
                      padding: '10px 16px', 
                      background: '#f8fafc', 
                      borderTop: '1px solid #e2e8f0', 
                      textAlign: 'center' 
                    }}>
                      <Link 
                        href="/admin/transfers" 
                        onClick={() => setShowNotifications(false)}
                        style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Voir tous les versements & trésorerie →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className={`${styles.headerBadge} ${styles.badgeRole}`}>
                <Shield size={16} /> Super Admin
              </div>
            </div>
          </header>

          <main className={styles.dashboard}>
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
