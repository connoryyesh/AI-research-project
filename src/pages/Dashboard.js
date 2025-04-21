import React, { useEffect, useState } from 'react';
import Closed from './Closed'; // Adjust the path if needed

/* ---------- existing API endpoints ---------- */
const STATUS_API   = 'https://qvyovlq8u4.execute-api.us-east-2.amazonaws.com/survey-status';
const COUNTER_API  = 'https://psx08kge8h.execute-api.us-east-2.amazonaws.com/getSurveyCounter';

/* ---------- NEW: ratings endpoint (same stage) ---------- */
const RATINGS_API  = 'https://5ybxfcfpw0.execute-api.us-east-2.amazonaws.com/ratings';

const Dashboard = () => {
  const [surveyCount, setSurveyCount] = useState(null);
  const [isSurveyOpen, setIsSurveyOpen] = useState(null);
  const [downloading, setDownloading] = useState(false);

  /* ---------- fetch total completed ---------- */
  useEffect(() => {
    fetch(COUNTER_API)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSurveyCount(d.count))
      .catch(() => setSurveyCount('Unavailable'));
  }, []);

  /* ---------- fetch survey status ---------- */
  useEffect(() => {
    fetch(STATUS_API)
      .then(r => r.json())
      .then(d => setIsSurveyOpen(d.isOpen))
      .catch(() => setIsSurveyOpen(false));
  }, []);

  /* ---------- open / close survey ---------- */
  const toggleSurvey = async () => {
    try {
      const res = await fetch(STATUS_API, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ isOpen: !isSurveyOpen })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsSurveyOpen(data.isOpen);
    } catch {
      alert('Something went wrong while toggling the survey status.');
    }
  };

  /* ---------- NEW: download results ---------- */
  const downloadResults = async () => {
    try {
      setDownloading(true);
      const res = await fetch(RATINGS_API);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const rows = await res.json(); // [{questionId, question, rating1 … rating5}, …]

      /* build CSV */
      const header = ['questionId','question','rating1','rating2','rating3','rating4','rating5'];
      const csvLines = [
        header.join(','), // header row
        ...rows.map(r =>
          header.map(h => {
            let cell = r[h] ?? '';
            if (typeof cell === 'object' && cell !== null) {
              if ('S' in cell) cell = cell.S;
              else if ('N' in cell) cell = cell.N;
              else cell = JSON.stringify(cell);
            }
            cell = cell.toString().replace(/"/g, '""');
            return `"${cell}"`;
          }).join(',')
        )
      ];
      const blob = new Blob([csvLines.join('\r\n')], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);

      /* trigger download */
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

  /* ---------- render ---------- */
  if (isSurveyOpen === null)
    return <div>Loading survey status…</div>;

  return (
    <div className="container" style={{ textAlign:'center', padding:'2rem' }}>
      <h2>Welcome to the Researcher Management Dashboard</h2>
      <p>This is your dashboard where you can view statistics, access various features, and manage your research projects.</p>

      <div style={{ marginTop:'2rem', fontSize:'1.2rem' }}>
        <strong>Total Surveys Completed:</strong> {surveyCount ?? 'Loading…'}
      </div>

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

      <div style={{ marginTop:'2rem', border:'1px solid #ccc', padding:'1rem' }}>
        {isSurveyOpen
          ? (<>
               <h3>Survey is currently OPEN</h3>
               <p>Survey takers will be able to see the survey.</p>
             </>)
          : (<Closed />)
        }
      </div>

      {/* ---------- NEW: Download button ---------- */}
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
