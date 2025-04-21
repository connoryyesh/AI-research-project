import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminLayout() {
  const navigate = useNavigate();
  const { logOut } = useAuth(); // Custom context hook for managing auth state

  /**
   * Logout logic: Clears the user's session from Cognito and redirects to home.
   * 🔐 If you integrate session storage, cookies, or a custom provider, update this function accordingly.
   */
  const handleLogout = async () => {
    try {
      await logOut(); // Calls the logout function from AuthContext
      navigate('/');  // Redirect user back to home/login page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  /**
   * Custom style function for `NavLink`.
   * Highlights the current page by adjusting background and transform.
   * 🎨 Modify here if you want different active state effects or theme.
   */
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
      
      {/* === Sidebar Navigation === */}
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
          {/* === NavLink to Admin Dashboard === */}
          <NavLink to="/admin/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>

          {/* === NavLink to Group Settings === */}
          <NavLink to="/admin/group-settings" style={navLinkStyle}>
            Group Settings
          </NavLink>

          {/* === NavLink to Role Management === */}
          <NavLink to="/admin/manage-roles" style={navLinkStyle}>
            User Role Management
          </NavLink>

          {/* === Logout Button === */}
          {/* ⚠️ Do not navigate with NavLink directly — instead call handleLogout() */}
          <NavLink 
            to="#" 
            onClick={(e) => {
              e.preventDefault(); // Prevent link default behavior
              handleLogout();     // Call logout logic
            }}
            style={({ isActive }) => ({
              ...navLinkStyle({ isActive: false }),
              backgroundColor: '#888' // Override color to make logout distinct
            })}
          >
            Logout
          </NavLink>
        </nav>
      </aside>

      {/* === Main Content Slot === */}
      {/* React Router’s <Outlet /> renders the child route here */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
