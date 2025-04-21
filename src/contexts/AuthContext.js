// AuthContext.js — Provides global auth state and role context.
// If the structure of the user object changes, update context consumers accordingly.

// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getCurrentUser, 
  fetchAuthSession,
  signOut
} from 'aws-amplify/auth';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication state on mount and when auth changes
  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      console.log("Checking auth state...");
      // Get the current authenticated user
      const currentUser = await getCurrentUser();
      console.log("Current user:", currentUser);
      
      // Get user session for more details
      const session = await fetchAuthSession();
      console.log("Session:", session);
      
      // Get user role from the token claims or a default role
      let userRole = 'survey-taker'; // Default role for new users
      
      try {
        // Extract role from Cognito tokens if available
        const idToken = session.tokens?.idToken;
        if (idToken) {
          const payload = idToken.payload;
          console.log("Token payload:", payload);
          
          // Check different locations for role information
          if (payload['cognito:groups'] && payload['cognito:groups'].length > 0) {
            userRole = payload['cognito:groups'][0];
          } else if (payload['custom:role']) {
            userRole = payload['custom:role'];
          } else if (payload['role']) {
            userRole = payload['role'];
          }
          
          console.log("Determined user role:", userRole);
        }
      } catch (tokenError) {
        console.error('Error extracting role from token:', tokenError);
      }
      
      // Set the authenticated user with role
      setUser({
        ...currentUser,
        role: userRole
      });
      setIsAuthenticated(true);
      console.log("Auth state updated - user is authenticated");
    } catch (error) {
      // User is not authenticated
      console.log('User not authenticated or error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth check
  useEffect(() => {
    checkAuthState();
  }, []);

  // Logout function that properly handles Cognito signOut
  const logOut = async () => {
    try {
      await signOut({ global: true });
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  };

  // The value that will be supplied to the context
  const value = {
    user,
    isAuthenticated,
    isLoading,
    checkAuthState,
    logOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};