import React, { useEffect, useState } from 'react';
import Closed from './Closed'; // Fallback component shown when survey is disabled

// === API Endpoints ===
// These endpoints are hardcoded for now; if you change stages or environments, update them here.
// You may want to eventually pull them from environment variables or a config file.
const STATUS_API   = 'https://qvyovlq8u4.execute-api.us-east-2.amazonaws.com/survey-status';      // Survey open/closed state
const COUNTER_API  = 'https://psx08kge8h.execute-api.us-east-2.amazonaws.com/getSurveyCounter';   // Total number of completed surveys
const RATINGS_API  = 'https://5ybxfcfpw0.execute-api.us-east-2.amazonaws.com/ratings';            // Aggregated rating results from respondents

const Dashboard = () => {
  const [surveyCount, setSurveyCount] = useState(null);         // Number of completed surveys
  const [isSurveyOpen, setIsSurveyOpen] = useState(null);       // Open/closed state of the survey
  const [downloading, setDownloading] = useState(false);        // Used to disable button during CSV download

  // === Load total number of completed surveys on mount ===
  // If COUNTER_API ever changes shape or authentication is added, adjust parsing here
  useEffect(() => {
    fetch(COUNTER_API)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSurveyCount(d.count))
      .catch(() => setSurveyCount('Unavailable'));
  }, []);

  // === Load whether the survey is currently open ===
  // Response is expected in format: { isOpen: true/false }
  useEffect(() => {
    fetch(STATUS_API)
      .then(r => r.json())
      .then(d => setIsSurveyOpen(d.isOpen))
      .catch(() => setIsSurveyOpen(false));
  }, []);

  // === Toggle the open/closed state of the survey ===
  // This POSTs to the same endpoint used for GET but includes a JSON body
  // ⚠️ If your backend adds authentication, make sure to include headers like Authorization
  const toggleSurvey = async () => {
    try {
      const res = await fetch(STATUS_API, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ isOpen: !isSurveyOpen })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsSurveyOpen(data.isOpen); // Update UI state after success
    } catch {
      alert('Something went wrong while toggling the survey status.');
    }
  };

  // === Export CSV with question-level ratings ===
  // Transforms a response like [{ questionId, rating1, ... }] into a downloadable file
  const downloadResults = async () => {
    try {
      setDownloading(true);
      const res = await fetch(RATINGS_API);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const rows = await res.json();

      // Define CSV header and flatten each row
      const header = ['questionId','question','rating1','rating2','rating3','rating4','rating5'];
      const csvLines = [
        header.join(','), // header row
        ...rows.map(r =>
          header.map(h => {
            let cell = r[h] ?? '';
            if (typeof cell === 'object' && cell !== null) {
              // Handle DynamoDB object shape if not already normalized
              if ('S' in cell) cell = cell.S;
              else if ('N' in cell) cell = cell.N;
              else cell = JSON.stringify(cell);
            }
            cell = cell.toString().replace(/"/g, '""'); // Escape quotes for CSV safety
            return `"${cell}"`;
          }).join(',')
        )
      ];

      // Create download blob and trigger browser download
      const blob = new Blob([csvLines.join('\r\n')], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'responses.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Unable to download results.');
    } finally {
      setDownloading(false);
    }
  };

  // === Render loading state while checking status ===
  if (isSurveyOpen === null)
    return <div>Loading survey status…</div>;

  return (
    <div className="container" style={{ textAlign:'center', padding:'2rem' }}>
      <h2>Welcome to the Researcher Management Dashboard</h2>
      <p>This is your dashboard where you can view statistics, access various features, and manage your research projects.</p>

      {/* Survey completion count */}
      <div style={{ marginTop:'2rem', fontSize:'1.2rem' }}>
        <strong>Total Surveys Completed:</strong> {surveyCount ?? 'Loading…'}
      </div>

      {/* Toggle survey open/closed */}
      <div style={{ marginTop:'2rem' }}>
        <strong>Survey Status:</strong>
        <button
          onClick={toggleSurvey}
          style={{
            marginLeft:'1rem',
            padding:'0.5rem 1rem',
            backgroundColor: isSurveyOpen ? '#600000' : '#007bff',
            color:'#fff',
            border:'none',
            borderRadius:'8px'
          }}>
          {isSurveyOpen ? 'Close Survey' : 'Open Survey'}
        </button>
      </div>

      {/* Visual status block */}
      <div style={{ marginTop:'2rem', border:'1px solid #ccc', padding:'1rem' }}>
        {isSurveyOpen
          ? (
              <>
                <h3>Survey is currently OPEN</h3>
                <p>Survey takers will be able to see the survey.</p>
              </>
            )
          : (<Closed />)
        }
      </div>

      {/* Download Ratings CSV */}
      <div style={{ marginTop:'2rem' }}>
        <button
          onClick={downloadResults}
          disabled={downloading}
          style={{
            padding:'0.6rem 1.4rem',
            backgroundColor:'#600000',
            color:'#fff',
            border:'none',
            borderRadius:'8px',
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.6 : 1
          }}>
          {downloading ? 'Preparing…' : 'Download Results (CSV)'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
