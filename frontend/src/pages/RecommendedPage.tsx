import React from 'react';

export const RecommendedPage: React.FC = () => {
  return (
    <div>
      <h1 className="auth-heading" style={{ textAlign: 'left' }}>Recommended</h1>
      <p className="auth-subheading" style={{ textAlign: 'left' }}>Personalized course recommendations for your growth.</p>
      <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
         <p className="text-secondary opacity-50">Recommendations coming soon...</p>
      </div>
    </div>
  );
};
