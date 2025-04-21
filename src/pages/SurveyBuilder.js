import React, { useState } from 'react';

/**
 * SurveyBuilder Component
 * 
 * This interface allows researchers to build a custom survey by:
 * - Specifying a title and description
 * - Adding, modifying, or removing questions
 * - Choosing different types of questions (short answer, MCQ, checkboxes, etc.)
 * - Marking questions as required
 * - Saving the final survey to the backend API
 * 
 * Backend Endpoint:
 * - POST to `https://tl2l68tv49.execute-api.us-east-2.amazonaws.com/questions`
 */
const SurveyBuilder = () => {
  // === Survey-level metadata ===
  const [surveyTitle, setSurveyTitle] = useState("Untitled Survey");
  const [surveyDescription, setSurveyDescription] = useState("");

  // === Question list state ===
  const [questions, setQuestions] = useState([]);

  /**
   * Adds a blank new question to the list with default type "short-answer"
   * Each question gets a unique ID based on timestamp
   */
  const addQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      text: "",
      type: "short-answer",
      options: [],
      required: false
    }]);
  };

  /**
   * Removes a question by its unique ID
   */
  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  /**
   * Updates the question text for a given question ID
   */
  const handleQuestionChange = (id, text) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, text } : q)));
  };

  /**
   * Changes the type of a question and initializes options for list-based types
   * If switching to MCQ/checkbox/dropdown, create at least one default option
   */
  const handleTypeChange = (id, type) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          type,
          options: (type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown')
            ? ["Option 1"] : []
        };
      }
      return q;
    }));
  };

  /**
   * Handles updates to individual options inside list-based questions
   */
  const handleOptionChange = (questionId, optionIndex, text) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? text : opt) }
        : q
    ));
  };

  /**
   * Adds a new empty option to a question
   */
  const addOption = (questionId) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
        : q
    ));
  };

  /**
   * Removes a single option from a list-based question
   */
  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
        : q
    ));
  };

  /**
   * Toggles the 'required' status for a given question
   */
  const toggleRequired = (id) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, required: !q.required } : q
    ));
  };

  /**
   * saveSurvey — Serializes and POSTs the built survey to the backend
   * Adjust this logic if your API evolves to accept different data formats
   */
  const saveSurvey = async () => {
    alert("Survey saved! (Mock Functionality)");
    console.log({ surveyTitle, surveyDescription, questions });

    const payload = {
      surveyTitle,
      surveyDescription,
      questions
    };

    try {
      const API_URL = "https://tl2l68tv49.execute-api.us-east-2.amazonaws.com/questions";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`POST /questions failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("Survey saved to backend:", result);
    } catch (err) {
      console.error("Error saving survey to backend:", err);
    }
  };

  // === Common styling for inputs ===
  const inputStyle = {
    padding: '0.75rem',
    margin: '0.75rem 0',
    width: '100%',
    boxSizing: 'border-box'
  };

  // === Main Component JSX ===
  return (
    <div className="container">
      <h2>Survey Builder</h2>

      {/* === Survey Metadata Inputs === */}
      <input
        type="text"
        placeholder="Survey Title"
        value={surveyTitle}
        onChange={(e) => setSurveyTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Survey Description"
        value={surveyDescription}
        onChange={(e) => setSurveyDescription(e.target.value)}
        style={{ ...inputStyle, minHeight: '80px' }}
      />

      {/* === Render Each Question Card === */}
      {questions.map((q, index) => (
        <div key={q.id} style={{
          marginBottom: '1rem',
          padding: '1rem',
          border: '1px solid #ccc'
        }}>
          <span style={{ fontWeight: 'bold' }}>Q{index + 1}:</span>

          {/* Question Text Input */}
          <input
            type="text"
            placeholder="Enter question text"
            value={q.text}
            onChange={(e) => handleQuestionChange(q.id, e.target.value)}
            style={inputStyle}
          />

          {/* Type Selector */}
          <select
            value={q.type}
            onChange={(e) => handleTypeChange(q.id, e.target.value)}
            style={inputStyle}
          >
            <option value="short-answer">Short Answer</option>
            <option value="paragraph">Paragraph</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="checkbox">Checkboxes</option>
            <option value="dropdown">Dropdown</option>
            <option value="linear-scale">Linear Scale</option>
          </select>

          {/* Dynamic Option Management */}
          {(q.type === "multiple-choice" || q.type === "checkbox" || q.type === "dropdown") && (
            <div style={{ margin: '0.75rem 0' }}>
              {q.options.map((option, i) => (
                <div key={i} style={{
                  marginBottom: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                    style={inputStyle}
                  />
                  <button onClick={() => removeOption(q.id, i)}>❌</button>
                </div>
              ))}
              <button onClick={() => addOption(q.id)}>➕ Add Option</button>
            </div>
          )}

          {/* Required Toggle + Delete Button */}
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <label>
              Required:
              <input
                type="checkbox"
                checked={q.required}
                onChange={() => toggleRequired(q.id)}
                style={{ marginLeft: '0.5rem' }}
              />
            </label>
            <button onClick={() => removeQuestion(q.id)}>🗑️ Remove</button>
          </div>
        </div>
      ))}

      {/* === Controls for Adding and Saving === */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={addQuestion}>➕ Add Question</button>
        <button onClick={saveSurvey}>💾 Save Survey</button>
      </div>
    </div>
  );
};

export default SurveyBuilder;
