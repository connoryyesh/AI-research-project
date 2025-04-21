import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ResearcherLayout() {
  const navigate = useNavigate();
  const { logOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '0.75rem 1rem',
    backgroundColor: isActive ? '#800000' : '#500000',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    textAlign: 'center',
    fontSize: '1rem',
    marginBottom: '1rem'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <aside style={{
        width: '240px',
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#500000', fontSize: '1.75rem' }}>
          Researcher Portal
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <NavLink to="/researcher/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/researcher/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>
          {/* Use NavLink for consistent styling but with onClick handler */}
          <NavLink 
            to="#" 
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={({ isActive }) => ({
              ...navLinkStyle({ isActive: false }),
              backgroundColor: '#888'
            })}
          >
            Logout
          </NavLink>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default ResearcherLayout;