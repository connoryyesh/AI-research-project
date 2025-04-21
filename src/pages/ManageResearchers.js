import React, { useState } from 'react';

const ManageResearchers = () => {
  // === State management ===
  const [email, setEmail] = useState('');                   // Email of researcher to add/remove
  const [name, setName] = useState('');                     // Name of researcher to add
  const [message, setMessage] = useState('');               // UI feedback for success/error
  const [researcherCount, setResearcherCount] = useState(0); // Session-based count of added researchers

  // === Configuration: Project ID and base API path ===
  // This projectId is hardcoded to "1". If your app will eventually allow project switching,
  // consider lifting this to a prop or context variable.
  const projectId = "1";
  const baseApiUrl = `https://6tydwlnmqj.execute-api.us-east-2.amazonaws.com/projects/${projectId}/researchers`;

  // === Adds a researcher via POST ===
  // This calls your backend Lambda configured at /projects/{id}/researchers
  const handleAddResearcher = async () => {
    if (!name || !email) {
      setMessage('Please enter both name and email');
      return;
    }

    try {
      const response = await fetch(baseApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }) // Expected format by the Lambda function
      });

      if (!response.ok) {
        throw new Error(`POST failed with status ${response.status}`);
      }

      const result = await response.json();

      // On success: increment UI counter, show confirmation, clear fields
      setResearcherCount(prev => prev + 1);
      setMessage(`Researcher ${email} added to project ${projectId} (${researcherCount + 1})`);
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error adding researcher:', error);
      setMessage(`Error adding researcher: ${error.message}`);
    }
  };

  // === Removes a researcher via DELETE ===
  // Assumes the backend supports DELETE at /projects/{id}/researchers/{email}
  const handleRemoveResearcher = async () => {
    if (!email) {
      setMessage('Please enter an email to remove');
      return;
    }

    try {
      const deleteUrl = `${baseApiUrl}/${email}`;
      const response = await fetch(deleteUrl, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`DELETE failed with status ${response.status}`);
      }

      const result = await response.json();
      setMessage(result.message || 'Researcher removed successfully');
      setEmail('');
    } catch (error) {
      console.error('Error removing researcher:', error);
      setMessage(`Error removing researcher: ${error.message}`);
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h2>Manage Researchers (Project ID: {projectId})</h2>

      {/* Count displayed per session only — useful for real-time feedback */}
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Researchers added in this session: {researcherCount}
      </p>

      {/* === Name input === */}
      <input
        type="text"
        placeholder="Enter Researcher Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          padding: '0.75rem',
          margin: '0.75rem 0',
          width: '100%',
          boxSizing: 'border-box'
        }}
      />

      {/* === Email input === */}
      <input
        type="email"
        placeholder="Enter Researcher Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: '0.75rem',
          margin: '0.75rem 0',
          width: '100%',
          boxSizing: 'border-box'
        }}
      />

      {/* === Action Buttons: Add + Remove === */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={handleAddResearcher} style={{ padding: '0.75rem 1.25rem' }}>
          Add Researcher
        </button>
        <button onClick={handleRemoveResearcher} style={{ padding: '0.75rem 1.25rem' }}>
          Remove Researcher
        </button>
      </div>

      {/* === Feedback message === */}
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
};

export default ManageResearchers;
