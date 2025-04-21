import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ResearcherLayout() {
  const navigate = useNavigate();
  const { logOut } = useAuth(); // Access logout function from authentication context

  // === Handles researcher logout action ===
  // Removes tokens and redirects back to landing page
  const handleLogout = async () => {
    try {
      await logOut();      // Will clear user session in context and Cognito
      navigate('/');       // Redirect to homepage after logout
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // === Style logic for NavLink buttons ===
  // Highlights active link and applies hover/scale transition
  const navLinkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '0.75rem 1rem',
    backgroundColor: isActive ? '#800000' : '#500000', // Maroon on active
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    textAlign: 'center',
    fontSize: '1rem',
    marginBottom: '1rem'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      
      {/* === Sidebar Navigation === */}
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
          {/* === Dashboard link === */}
          <NavLink to="/researcher/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>

          {/* === Group Settings === */}
          <NavLink to="/researcher/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>

          {/* === Logout action (styled like a NavLink but with a click handler) === */}
          <NavLink 
            to="#" 
            onClick={(e) => {
              e.preventDefault(); // Prevent default NavLink behavior
              handleLogout();     // Call logout handler
            }}
            style={({ isActive }) => ({
              ...navLinkStyle({ isActive: false }),
              backgroundColor: '#888' // Grey out logout button
            })}
          >
            Logout
          </NavLink>
        </nav>
      </aside>

      {/* === Main content outlet === */}
      {/* This is where nested routes will render */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default ResearcherLayout;
