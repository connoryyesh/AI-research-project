import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Optional: used if expanding auth checks

function Layout() {
  const navigate = useNavigate();

  /**
   * Handle logout by clearing session and redirecting to landing page
   * 🔧 If you implement token-based auth or use cookies instead of sessionStorage,
   * you'll need to update this logic accordingly.
   */
  const handleLogout = () => {
    sessionStorage.removeItem('loggedIn');
    navigate('/');
  };

  /**
   * Reusable styling function for NavLink
   * Highlights the active tab and animates on selection
   * 🔄 If you add more routes or change color themes, update here
   */
  const navLinkStyle = ({ isActive }) => ({
    ...navButton,
    backgroundColor: isActive ? '#800000' : '#500000',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    transition: 'background-color 0.2s, transform 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: "#fafafa" }}>
      
      {/* === Sidebar Navigation === */}
      {/* If adding a logo or global user info, add above <h2> */}
      <aside style={{
        width: '240px',
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        padding: '1.5rem'
      }}>
        <h2 style={{
          marginTop: 0,
          marginBottom: '1.5rem',
          color: '#500000',
          fontSize: '1.75rem'
        }}>
          Researcher Portal
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* === Navigation Links === */}
          {/* 🔧 To add new sections, just insert additional <NavLink />s below */}

          <NavLink to="/manage-researchers" style={navLinkStyle}>
            Manage Researchers
          </NavLink>

          <NavLink to="/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>

          <NavLink to="/survey-builder" style={navLinkStyle}>
            Survey Builder
          </NavLink>

          {/* === Logout Button === */}
          {/* 🔄 If login method changes (e.g. AWS Cognito, OAuth), update logout handling */}
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

      {/* === Main Content Outlet === */}
      {/* This is where child route content will be rendered based on current URL */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

/**
 * 🔁 Shared base style for nav buttons
 * Applied to NavLinks and logout button
 * 📦 You can convert this to a class if integrating a design system like Tailwind or Bootstrap
 */
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
