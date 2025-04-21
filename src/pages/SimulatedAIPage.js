import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Closed from './Closed'; // Component shown when the survey is inactive

// === API Endpoints ===
const SURVEY_STATUS_API     = 'https://qvyovlq8u4.execute-api.us-east-2.amazonaws.com/survey-status';
const FIXED_QUESTIONS_API   = 'https://5ybxfcfpw0.execute-api.us-east-2.amazonaws.com/fixed-questions';
const ASK_API               = 'https://5ybxfcfpw0.execute-api.us-east-2.amazonaws.com/ask';
const RATE_API              = 'https://5ybxfcfpw0.execute-api.us-east-2.amazonaws.com/rate';
const INCREMENT_COUNTER_API = 'https://psx08kge8h.execute-api.us-east-2.amazonaws.com/incrementSurveyCounter';

const SimulatedAIPage = () => {
  const navigate = useNavigate();

  // === App-level states ===
  const [isSurveyOpen, setIsSurveyOpen] = useState(null); // Whether survey is accepting responses
  const [questions, setQuestions] = useState([]);         // Loaded fixed questions
  const [selectedQuestion, setSelectedQuestion] = useState(null); // Active question
  const [preMessage, setPreMessage] = useState('');       // Simulated "thinking" message
  const [finalAnswer, setFinalAnswer] = useState('');     // Simulated AI answer
  const [rating, setRating] = useState(0);                // Star-based user rating

  // === Styling preferences that can be controlled per-answer ===
  const [answerColor, setAnswerColor] = useState('#000'); // AI answer color
  const [answerFont, setAnswerFont] = useState('Arial');  // AI answer font

  // === Modal management states ===
  const [showConsent, setShowConsent] = useState(true);       // Initial consent screen
  const [showPopup, setShowPopup] = useState(false);          // Instructions popup
  const [showThankYouPopup, setShowThankYouPopup] = useState(false); // Thank you message at end

  // === Check if survey is open ===
  useEffect(() => {
    async function checkSurveyStatus() {
      try {
        const res = await fetch(SURVEY_STATUS_API);
        const data = await res.json();
        setIsSurveyOpen(data.isOpen);
      } catch (err) {
        console.error('Error checking survey status:', err);
        setIsSurveyOpen(false);
      }
    }
    checkSurveyStatus();
  }, []);

  // === Fetch fixed question list ===
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(FIXED_QUESTIONS_API);
        if (!res.ok) throw new Error(`GET /fixed-questions failed: ${res.status}`);
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error('Error fetching questions:', err);
      }
    }
    loadQuestions();
  }, []);

  // === Consent Management ===
  const handleAcceptConsent  = () => { setShowConsent(false); setShowPopup(true); };
  const handleDeclineConsent = () => { navigate('/survey/logout'); };
  const handleClosePopup     = () => { setShowPopup(false); };

  // === Handle selection of a question ===
  const handleSelectQuestion = async (q) => {
    setSelectedQuestion(q);
    setPreMessage('');
    setFinalAnswer('');
    setRating(0);
    setAnswerColor('#000');
    setAnswerFont('Arial');

    // === Ask for "pre" phase response ===
    try {
      const res = await fetch(ASK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, phase: 'pre' })
      });
      if (!res.ok) throw new Error(`POST /ask (pre) failed: ${res.status}`);
      const data = await res.json();
      setPreMessage(data.preAnswerMessage || '');
    } catch (err) {
      console.error('Error fetching pre-answer:', err);
      setPreMessage('Error retrieving pre-answer.');
    }

    // === Ask for "final" phase response ===
    try {
      const res2 = await fetch(ASK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, phase: 'final' })
      });
      if (!res2.ok) throw new Error(`POST /ask (final) failed: ${res2.status}`);
      const data2 = await res2.json();
      setFinalAnswer(data2.finalAnswer || '');
      if (data2.colorScheme) setAnswerColor(data2.colorScheme);
      if (data2.fontFace)    setAnswerFont(data2.fontFace);
    } catch (err) {
      console.error('Error fetching final answer:', err);
      setFinalAnswer('Error retrieving final answer.');
    }
  };

  // === Rate current question's AI answer ===
  const handleRate = async () => {
    if (!selectedQuestion) return;
    try {
      const res = await fetch(RATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: selectedQuestion.id, rating })
      });
      if (!res.ok) throw new Error(`POST /rate failed: ${res.status}`);
      const data = await res.json();
      alert(`Rating submitted! ${data.message}`);
    } catch (err) {
      console.error('Error rating answer:', err);
      alert('Failed to submit rating.');
    }
  };

  // === Render interactive stars ===
  const renderStars = () => (
    <div>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => setRating(i)}
          style={{ cursor: 'pointer', fontSize: '1.5rem', color: i <= rating ? 'gold' : '#ccc', marginRight: '0.2rem' }}
        >★</span>
      ))}
    </div>
  );

  // === End of survey - increment counter ===
  const handleFinish = async () => {
    try {
      const res = await fetch(INCREMENT_COUNTER_API, { method: 'POST' });
      if (!res.ok) throw new Error(`Error updating survey count: ${res.status}`);
      const data = await res.json();
      console.log('Updated survey count:', data.count);
    } catch (err) {
      console.error('Error finishing survey:', err);
    }
    setShowThankYouPopup(true);
  };

  const handleThankYouLogout = () => { navigate('/survey/logout'); };

  // === Styles for modals and layout ===
  const overlayStyle   = { position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 };
  const modalStyle     = { backgroundColor:'white', padding:'2rem', borderRadius:'8px', textAlign:'center' };
  const containerStyle = { display:'flex', gap:'2rem', padding:'1rem' };
  const leftStyle      = { flex:1, border:'1px solid #ccc', padding:'1rem' };
  const rightStyle     = { flex:1, border:'1px solid #ccc', padding:'1rem' };

  // === Gate survey access if closed ===
  if (isSurveyOpen === null) return <div>Loading...</div>;
  if (!isSurveyOpen) return <Closed />;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>

      {/* === Consent Modal === */}
      {showConsent && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <p style={{ marginBottom: '1rem' }}>
              This study is part of ongoing research. Do you consent to participate?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button onClick={handleAcceptConsent}  style={{ ...btnStyle, backgroundColor: '#500000', color: '#fff' }}>Accept</button>
              <button onClick={handleDeclineConsent} style={{ ...btnStyle, backgroundColor: '#aaa', color: '#000' }}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* === Initial Info Popup === */}
      {!showConsent && showPopup && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <p>
              Please interact with each of the AI questions. Click a question, wait for the AI to respond, then rate how trustworthy the answer is (1–5 stars). After all prompts, click "Finished" to submit.
            </p>
            <button onClick={handleClosePopup} style={btnStyle}>Okay</button>
          </div>
        </div>
      )}

      {/* === Thank You Modal === */}
      {showThankYouPopup && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <p>Thank you for participating in this survey.</p>
            <button onClick={handleThankYouLogout} style={{ ...btnStyle, backgroundColor: '#500000', color: '#fff' }}>Logout</button>
          </div>
        </div>
      )}

      {/* === Main Survey Interaction Area === */}
      {!showConsent && (
        <>
          <h1 style={{ textAlign: 'center' }}>AI Dashboard</h1>
          <div style={containerStyle}>
            {/* Left Column: Question Selector */}
            <div style={leftStyle}>
              <h2>Questions</h2>
              {questions.map(q => (
                <div key={q.id} style={{ margin: '0.5rem 0' }}>
                  <button onClick={() => handleSelectQuestion(q)} style={{ cursor: 'pointer' }}>{q.question}</button>
                </div>
              ))}
              {selectedQuestion && (
                <div style={{ marginTop: '1rem' }}>
                  <h3>Selected: {selectedQuestion.question}</h3>
                  {preMessage  && <p style={{ fontStyle: 'italic', color: '#666' }}>{preMessage}</p>}
                  {finalAnswer && <p style={{ fontWeight: 'bold', color: answerColor, fontFamily: answerFont }}>{finalAnswer}</p>}
                </div>
              )}
            </div>

            {/* Right Column: Rating */}
            <div style={rightStyle}>
              <h2>Rate the Answer</h2>
              {!selectedQuestion ? (
                <p>Select a question on the left first.</p>
              ) : (
                <>
                  <div style={{ margin: '1rem 0' }}>{renderStars()}</div>
                  <button onClick={handleRate} disabled={!finalAnswer} style={btnStyle}>
                    Submit Rating
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Finish Button */}
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button onClick={handleFinish} style={btnStyle}>Finished</button>
          </div>
        </>
      )}
    </div>
  );
};

// === Reusable button style ===
const btnStyle = {
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
};

export default SimulatedAIPage;
