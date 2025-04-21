import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('loggedIn');
    navigate('/');
  };

  // Style function for NavLink to highlight active state
  const navLinkStyle = ({ isActive }) => ({
    ...navButton,
    backgroundColor: isActive ? '#800000' : '#500000',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    transition: 'background-color 0.2s, transform 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: "#fafafa" }}>
      <aside style={{
        width: '240px',
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        padding: '1.5rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#500000', fontSize: '1.75rem' }}>
          Researcher Portal
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Dashboard button removed as requested */}
          <NavLink to="/manage-researchers" style={navLinkStyle}>
            Manage Researchers
          </NavLink>
          <NavLink to="/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>
          <NavLink to="/survey-builder" style={navLinkStyle}>
            Survey Builder
          </NavLink>
          <button 
            onClick={handleLogout}
            style={{
              ...navButton,
              backgroundColor: '#888',
              width: '100%',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

const navButton = {
  display: 'block',
  padding: '0.75rem 1rem',
  border: 'none',
  backgroundColor: '#500000',
  color: '#fff',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '1rem',
  textDecoration: 'none'
};

export default Layout;
