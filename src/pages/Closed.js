// === Functional stateless component that shows a locked-out message to users ===
// This component is conditionally rendered when the backend (via /survey-status) marks the survey as "closed"
// ✏️ You can reuse or adapt this component to show "maintenance mode", "feature disabled", or custom user blocks.

const Closed = () => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>This app is currently closed to survey takers.</h2>
      <p>Please check back later or contact your research administrator.</p>
    </div>
  );
};

export default Closed;
