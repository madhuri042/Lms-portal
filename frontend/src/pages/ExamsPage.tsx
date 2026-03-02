import React from 'react';

export const ExamsPage: React.FC = () => {
  return (
    <div>
      <h1 className="auth-heading" style={{ textAlign: 'left' }}>Exams</h1>
      <p className="auth-subheading" style={{ textAlign: 'left' }}>Stay on top of your upcoming tests and assessments.</p>
      <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
         <p className="text-secondary opacity-50">Exams schedule coming soon...</p>
      </div>
    </div>
  );
};
