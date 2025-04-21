import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify'; // AWS Amplify Auth module for interacting with Cognito

const UserProfile = () => {
  const [user, setUser] = useState(null);      // Holds the authenticated user object
  const [loading, setLoading] = useState(true); // Loading state while fetching user data

  /**
   * On component mount, attempt to fetch the currently authenticated user.
   * 
   * 📍 If the user is not logged in or session is expired, this will throw.
   * 🔧 If switching to token-based or federated auth, update this method accordingly.
   */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await Auth.currentAuthenticatedUser(); // Cognito user info
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false); // Stop loading either way
      }
    };

    fetchUserData();
  }, []);

  // === Loading state ===
  if (loading) {
    return <div>Loading user data...</div>;
  }

  // === Fallback for no user ===
  // 🔐 If a user isn't found, they may be logged out or unauthorized
  if (!user) {
    return <div>Not signed in</div>;
  }

  // === Extract user details ===
  // For AWS Cognito users, this is in `user.attributes`
  const userInfo = user.attributes;

  const email = userInfo.email;
  const name = userInfo.name || userInfo.email; // If name doesn't exist, fallback to email
  const picture = userInfo.picture;             // This may be set for Google/Federated login users

  return (
    <div style={{ 
      padding: '10px', 
      display: 'flex', 
      alignItems: 'center',
      borderRadius: '8px',
      background: '#f5f5f5',
      marginBottom: '20px'
    }}>
      {/* === Profile Picture === */}
      {/* 📷 To show images for Cognito users, ensure the attribute "picture" is included in token claims */}
      {picture && (
        <img 
          src={picture} 
          alt="Profile" 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%',
            marginRight: '10px'
          }}
        />
      )}

      {/* === Name + Email block === */}
      <div>
        <div style={{ fontWeight: 'bold' }}>{name}</div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>{email}</div>
      </div>
    </div>
  );
};

export default UserProfile;
