import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SurveyTakerLayout() {
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <header style={{
        padding: '1rem',
        backgroundColor: '#500000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h2>Survey Taker Portal</h2>
      </header>
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
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