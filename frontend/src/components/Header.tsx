import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type User = {
  firstName: string;
  lastName: string;
  role: string;
};

type Notification = {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  assignment?: { title: string };
  createdAt: string;
};

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInstructorOrAdmin = user.role === 'instructor' || user.role === 'admin';

  useEffect(() => {
    if (!isInstructorOrAdmin) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          setNotifications(data.data ?? []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isInstructorOrAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <header className="dashboard-header">
      <div className="search-container">
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input type="text" className="search-input" placeholder="Search courses, materials..." />
      </div>

      <div className="header-actions">
        {isInstructorOrAdmin && (
          <div className="notification-btn" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {unreadCount > 0 && <span className="notification-dot" style={{ position: 'absolute', top: 0, right: 0 }} />}
              {unreadCount > 0 && (
                <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{unreadCount}</span>
              )}
            </button>
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  minWidth: 320,
                  maxWidth: 400,
                  maxHeight: 400,
                  overflow: 'auto',
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 14 }}>Notifications</strong>
                  {unreadCount > 0 && (
                    <button type="button" className="btn btn-sm btn-link p-0" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                    No notifications
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {notifications.slice(0, 10).map((n) => (
                      <li key={n._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Link
                          to="/dashboard/submissions"
                          onClick={() => setShowDropdown(false)}
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            color: '#1e293b',
                            textDecoration: 'none',
                            background: n.read ? 'transparent' : '#f0f9ff',
                            fontSize: 14,
                          }}
                        >
                          <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                          {n.message && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{n.message}</div>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {notifications.length > 0 && (
                  <div style={{ padding: 8, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Link to="/dashboard/submissions" onClick={() => setShowDropdown(false)} className="btn btn-sm btn-primary">
                      View all submissions
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!isInstructorOrAdmin && (
          <div className="notification-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
        )}

        <div className="user-profile">
          <span className="header-user-info">
            <span className="header-user-name">{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'}</span>
            <span className="header-user-role">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</span>
          </span>
          <button onClick={onLogout} className="sign-out-btn" aria-label="Sign out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </header>
  );
};
