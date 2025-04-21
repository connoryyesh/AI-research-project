import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * SurveyTakerLayout
 *
 * This layout component is used to wrap all survey-taker-facing pages (e.g., consent screen, questions, thank-you).
 * It provides a unified header, a main content section (using <Outlet /> for routing), and a logout button in the footer.
 */
function SurveyTakerLayout() {
  const navigate = useNavigate();
  const { logOut } = useAuth(); // Pulls the logout function from the custom AuthContext provider

  /**
   * Logs the user out and navigates them back to the homepage
   * This will typically remove tokens and clear Cognito sessions (depending on your AuthContext logic)
   */
  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/'); // Redirect to landing page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // === Main Layout Structure ===
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      
      {/* HEADER — Branding area */}
      <header style={{
        padding: '1rem',
        backgroundColor: '#500000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h2>Survey Taker Portal</h2>
      </header>

      {/* MAIN CONTENT — Dynamically populated by nested routes using <Outlet /> */}
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>

      {/* FOOTER — Contains logout button to let participants exit */}
      <footer style={{ padding: '1rem', textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            backgroundColor: '#888',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </footer>
    </div>
  );
}

export default SurveyTakerLayout;
