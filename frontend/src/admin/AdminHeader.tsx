import React, { useState } from 'react';
import { Bell, LogOut, User, Menu } from 'lucide-react';

type UserType = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

interface AdminHeaderProps {
  user: UserType;
  onLogout: () => void;
  onMenuClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ user, onLogout, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Admin';

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                <p className="px-4 py-2 text-sm font-medium text-slate-800">Notifications</p>
                <p className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</p>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 pr-3 rounded-lg hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800">{name}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </button>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
