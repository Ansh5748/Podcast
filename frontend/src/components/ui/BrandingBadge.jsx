import React from 'react';
import { useLocation } from 'react-router-dom';

const BrandingBadge = () => {
  const location = useLocation();
  
  // Hide on menu and AR pages
  const isHidden = location.pathname.includes('/menu/') || location.pathname.includes('/ar/');
  
  if (isHidden) return null;

  return (
    <a
      id="emergent-badge"
      target="_blank"
      rel="noopener noreferrer"
      href="https://github.com/Ansh5748"
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        textDecoration: 'none',
        padding: '6px 10px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        fontSize: '12px',
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <img
          style={{ width: '28px', height: '28px', marginRight: '8px', borderRadius: '50%' }}
          src="https://avatars.githubusercontent.com/u/169717681?s=96&v=4"
          alt="Divyansh"
        />
        <p
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            color: 'black',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Made by Divyansh
        </p>
      </div>
    </a>
  );
};

export default BrandingBadge;
