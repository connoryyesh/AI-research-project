// GroupSettings.js — Allows researchers to configure experiment prompts.
// Update here to change how AI prompts are defined, saved, or rendered.

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://8rtdjjqrv7.execute-api.us-east-2.amazonaws.com';

const GroupSettings = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/research-groups/all`);
        const data = Array.isArray(res.data) ? res.data : [];

        const all = [];
        data.forEach(group => {
          const qs = group.questionsJson ? JSON.parse(group.questionsJson) : [];
          qs.forEach(q => {
            all.push({
              ...q,
              fontFace: q.fontFace || group.fontFace || 'Arial',
              colorScheme: q.colorScheme || group.colorScheme || '#000000',
              groupId: group.groupId,
            });
          });
        });

        setQuestions(all);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error loading saved questions');
      }
    };

    fetchSettings();
  }, []);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        delay: '',
        preAnswer: '',
        answer: '',
        fontFace: 'Arial',
        colorScheme: '#000000',
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const removeQuestion = async (index) => {
    const q = questions[index];
    if (q.groupId) {
      try {
        await axios.delete(`${API_BASE_URL}/research-groups/${q.groupId}/config`, {
          data: { questionText: q.question },
        });
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete question from DynamoDB');
      }
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedQuestions = [...questions];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const groupId = q.groupId && q.groupId !== "undefined" ? q.groupId : undefined;

        const endpoint = groupId
          ? `${API_BASE_URL}/research-groups/${groupId}/config`
          : `${API_BASE_URL}/research-groups/undefined/config`;

        const res = await axios.put(endpoint, {
          fontFace: q.fontFace,
          colorScheme: q.colorScheme,
          questions: [q],
        });

        // ✅ Assign new groupId if it was undefined
        if (!q.groupId && res.data.message.includes("Saved group")) {
          const match = res.data.message.match(/Saved group (\d+)/);
          if (match) {
            updatedQuestions[i].groupId = match[1];
          }
        }
      }

      setQuestions(updatedQuestions);
      alert(`${questions.length} questions saved successfully!`);
    } catch (err) {
      console.error('Save error:', err);
      setError('Error saving one or more questions.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '0.75rem',
    margin: '0.75rem 0',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1>Group Settings – Survey Builder</h1>
      {loading && <p>Saving settings...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>Questions</h2>
        {questions.map((q, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              marginBottom: '1.5rem',
              padding: '1rem',
            }}
          >
            <h3>Question {index + 1}</h3>
            {q.groupId && (
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                Saved in Group ID: {q.groupId}
              </p>
            )}

            <label>Font Face:</label>
            <select
              value={q.fontFace}
              onChange={(e) => updateQuestion(index, 'fontFace', e.target.value)}
              style={inputStyle}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>

            <label>Color Scheme:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="color"
                value={q.colorScheme}
                onChange={(e) => updateQuestion(index, 'colorScheme', e.target.value)}
                style={{ width: '50px', height: '40px' }}
              />
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: q.colorScheme,
                  border: '1px solid #ccc',
                }}
              />
            </div>

            <label>Question Text:</label>
            <input
              type="text"
              value={q.question}
              onChange={(e) => updateQuestion(index, 'question', e.target.value)}
              style={inputStyle}
              required
            />

            <label>Delay (seconds):</label>
            <input
              type="number"
              value={q.delay}
              onChange={(e) => updateQuestion(index, 'delay', e.target.value)}
              style={inputStyle}
            />

            <label>Pre-Answer:</label>
            <input
              type="text"
              value={q.preAnswer}
              onChange={(e) => updateQuestion(index, 'preAnswer', e.target.value)}
              style={inputStyle}
            />

            <label>Answer:</label>
            <textarea
              value={q.answer}
              onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
              style={{ ...inputStyle, minHeight: '60px' }}
              required
            />

            <button
              type="button"
              onClick={() => removeQuestion(index)}
              style={{ marginTop: '1rem' }}
            >
              Remove Question
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={addQuestion}>Add Question</button>
          <button type="submit">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

export default GroupSettings;
