import React from 'react';

export const MyCoursesPage: React.FC = () => {
  return (
    <div>
      <h1 className="auth-heading" style={{ textAlign: 'left' }}>My Courses</h1>
      <p className="auth-subheading" style={{ textAlign: 'left' }}>Manage and view your enrolled courses here.</p>
      <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
         <p className="text-secondary opacity-50">Course content coming soon...</p>
      </div>
    </div>
  );
};
