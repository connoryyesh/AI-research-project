// pages/Logout.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
  const navigate = useNavigate();
  const { logOut } = useAuth();
  const [error, setError] = useState('');
  
  useEffect(() => {
    const performSignOut = async () => {
      try {
        console.log("Starting logout process...");
        
        // Call the AuthContext logOut method
        const success = await logOut();
        
        if (success) {
          console.log("Logout successful, redirecting...");
          // Use a timeout to ensure state updates before navigation
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500);
        } else {
          setError("Logout failed. Please try again.");
        }
      } catch (error) {
        console.error('Error during sign out:', error);
        setError(`Error during logout: ${error.message}`);
        
        // Navigate anyway after a delay if there's an error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    };

    performSignOut();
  }, [navigate, logOut]);

  return (
    <div
      className="container"
      style={{
        maxWidth: '400px',
        margin: '3rem auto',
        textAlign: 'center'
      }}
    >
      <h2>Signing you out...</h2>
      <p>Please wait while we complete the sign out process.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Logout;