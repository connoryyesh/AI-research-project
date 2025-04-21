import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminLayout() {
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
          Admin Portal
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <NavLink to="/admin/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>
          {/* New link to the Role Management page */}
          <NavLink to="/admin/manage-roles" style={navLinkStyle}>
            User Role Management
          </NavLink>
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

export default AdminLayout;