import React from 'react';

export const ManageStudentsPage: React.FC = () => {
  return (
    <div className="reports-container">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="auth-heading" style={{ textAlign: 'left', marginBottom: '4px' }}>Manage Students</h1>
        <p className="auth-subheading" style={{ textAlign: 'left', marginBottom: 0 }}>
          View and manage students enrolled in your courses.
        </p>
      </header>

      <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p className="text-secondary opacity-50">Student management dashboard coming soon...</p>
      </div>
    </div>
  );
};
