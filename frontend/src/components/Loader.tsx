import React from 'react';

interface LoaderProps {
  message?: string;
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
  message = 'Loading...', 
  fullPage = true 
}) => {
  const loaderContent = (
    <div className="loader-container">
      <div className="loader-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loader-overlay">
        {loaderContent}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      {loaderContent}
    </div>
  );
};
