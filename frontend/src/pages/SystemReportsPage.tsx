import React from 'react';

export const SystemReportsPage: React.FC = () => {
  return (
    <div className="reports-container">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="auth-heading" style={{ textAlign: 'left', marginBottom: '4px' }}>System Reports</h1>
        <p className="auth-subheading" style={{ textAlign: 'left', marginBottom: 0 }}>
          Comprehensive analytics and system-wide performance overview.
        </p>
      </header>

      <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
         <p className="text-secondary opacity-50">Report generation and analytics dashboard coming soon...</p>
      </div>
    </div>
  );
};
