import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Custom context hook for authentication utilities

const Logout = () => {
  const navigate = useNavigate();       // Used for redirecting the user
  const { logOut } = useAuth();         // Pulls logOut function from global AuthContext
  const [error, setError] = useState(''); // For tracking and showing logout failure messages

  // === Effect: attempt logout as soon as this component loads ===
  // If logout fails (e.g., network issue or Cognito error), it logs and displays the error.
  useEffect(() => {
    const performSignOut = async () => {
      try {
        console.log("Starting logout process...");

        // Attempt to sign out through the shared logOut function (usually Cognito or Firebase)
        const success = await logOut();

        if (success) {
          console.log("Logout successful, redirecting...");
          // Small timeout helps prevent race conditions with context state
          setTimeout(() => {
            navigate('/', { replace: true }); // Redirect to home, replacing history stack
          }, 500);
        } else {
          // Fallback case if the logout function resolves but does not succeed
          setError("Logout failed. Please try again.");
        }
      } catch (error) {
        // Handle unexpected errors from logOut()
        console.error('Error during sign out:', error);
        setError(`Error during logout: ${error.message}`);

        // Still redirect user after showing message briefly
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    };

    performSignOut(); // Run logout on mount
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
