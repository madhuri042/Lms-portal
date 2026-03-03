import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIAssistantButton } from './AIAssistantButton';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout }) => {
  return (
    <div className="dashboard-shell">
      <Sidebar role={user.role} />
      <div className="main-container">
        <Header user={user} onLogout={onLogout} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <AIAssistantButton />
    </div>
  );
};
