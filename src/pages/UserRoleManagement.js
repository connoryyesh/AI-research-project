import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const UserRoleManagement = () => {
  // === State for list of all Cognito users ===
  const [users, setUsers] = useState([]);

  // === UI/Loading/Error states ===
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // === Form input for creating a new user ===
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('survey-taker');

  // === API base URL to your Lambda backend ===
  const API_BASE_URL = 'https://llbkoyb0a2.execute-api.us-east-2.amazonaws.com';

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetches all users from your Cognito-connected Lambda function.
   * Requires authorization via ID token.
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
      const data = await response.json();

      // Normalize user data
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sends a POST request to create a new user with a given role.
   * Cognito will automatically send an invitation or temporary password (if configured).
   */
  const addUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newUserEmail, role: newUserRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add user: ${response.status}`);
      }

      // Refresh list & show success
      fetchUsers();
      setSuccessMessage(`User ${newUserEmail} added successfully with role: ${newUserRole}`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('survey-taker');
    } catch (err) {
      console.error('Error adding user:', err);
      setError(`Failed to add user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates a Cognito user's role using their internal Cognito username (UUID).
   * Email address is used for UI but not passed to Cognito directly.
   */
  const updateUserRole = async (username, newRole) => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const userToUpdate = users.find(user =>
        user.Attributes?.find(attr => attr.Name === 'email')?.Value === username
      );
      if (!userToUpdate) throw new Error(`User with email ${username} not found`);

      const cognitoUsername = userToUpdate.Username;

      const response = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(cognitoUsername)}/role`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update user role`);
      }

      fetchUsers();
      setSuccessMessage(`Role updated successfully for ${username}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(`Failed to update role for ${username}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirms then updates a user's role
   */
  const handleRoleChange = (username, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateUserRole(username, newRole);
    }
  };

  // Roles allowed in the dropdown
  const availableRoles = ['admin', 'researcher', 'survey-taker'];

  return (
    <div className="user-role-management">
      <h2>User Role Management</h2>

      {/* === Error Banner === */}
      {error && (
        <div style={{ color: 'red', background: '#ffeeee', padding: '10px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '10px' }}>Dismiss</button>
        </div>
      )}

      {/* === Success Banner === */}
      {successMessage && (
        <div style={{ color: 'green', background: '#eeffee', padding: '10px', marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {/* === Add New User Form === */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3>Add New User</h3>
        <form onSubmit={addUser}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Role:</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Add User'}
          </button>
        </form>
      </div>

      {/* === Existing Users Table === */}
      <div>
        <h3>Existing Users</h3>
        <button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh List'}
        </button>

        {loading && <p>Loading users...</p>}
        {!loading && users.length === 0 && <p>No users found in the system.</p>}

        {!loading && users.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ borderBottom: '1px solid #ddd' }}>Email</th>
                <th style={{ borderBottom: '1px solid #ddd' }}>Role</th>
                <th style={{ borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userName =
                  user.Attributes?.find((attr) => attr.Name === 'name')?.Value || 'N/A';
                const userEmail =
                  user.Attributes?.find((attr) => attr.Name === 'email')?.Value ||
                  user.Username || 'N/A';
                const userRole =
                  user.Role ||
                  user.Attributes?.find((attr) => attr.Name === 'custom:role')?.Value ||
                  'survey-taker';

                return (
                  <tr key={user.Username} style={{ borderBottom: '1px solid #ddd' }}>
                    <td>{userName}</td>
                    <td>{userEmail}</td>
                    <td>
                      <select
                        value={userRole}
                        onChange={(e) => handleRoleChange(userEmail, e.target.value)}
                      >
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          if (window.confirm(`Apply the current role for ${userName}?`)) {
                            updateUserRole(userEmail, userRole);
                          }
                        }}
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserRoleManagement;
