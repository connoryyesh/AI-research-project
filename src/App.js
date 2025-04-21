// App.js — Main router for the application.
// If adding/removing routes or roles, ensure they’re declared and guarded properly.

// App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

// Import AWS configuration
import awsConfig from './aws-exports';

// Import Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components for Admin, Researcher, and SurveyTaker
import AdminLayout from './pages/AdminLayout';
import ResearcherLayout from './pages/ResearcherLayout';
import SurveyTakerLayout from './pages/SurveyTakerLayout';
import Dashboard from './pages/Dashboard';
import GroupSettings from './pages/GroupSettings';
import Logout from './pages/Logout';
import Login from './pages/Login';
import UserRoleManagement from './pages/UserRoleManagement';
import SimulatedAIPage from './pages/SimulatedAIPage';

// Initialize Amplify with the imported configuration
Amplify.configure(awsConfig);

// Protected route component ensures that protected routes are only accessible after authentication.
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to the /login route if not authenticated.
    return <Navigate to="/login" replace />;
  }
  
  // If a specific role is required, check it; otherwise, allow the authenticated user.
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'researcher') {
      return <Navigate to="/researcher/dashboard" replace />;
    } else {
      return <Navigate to="/survey" replace />;
    }
  }
  
  return children;
};

const AppRoutes = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Prevent any routing until the authentication state has been determined.
  if (isLoading) {
    return <div>Loading authentication state...</div>;
  }
  
  return (
    <Routes>
      {/* LOGIN ROUTE */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            // If already authenticated, automatically redirect based on the user’s role.
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.role === 'researcher' ? (
              <Navigate to="/researcher/dashboard" replace />
            ) : (
              <Navigate to="/survey" replace />
            )
          )
        }
      />

      {/* Redirect the root "/" to the login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="group-settings" element={<GroupSettings />} />
        <Route path="manage-roles" element={<UserRoleManagement />} />
        <Route path="logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* RESEARCHER ROUTES */}
      <Route
        path="/researcher"
        element={
          <ProtectedRoute requiredRole="researcher">
            <ResearcherLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="group-settings" element={<GroupSettings />} />
        <Route path="logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/researcher/dashboard" replace />} />
      </Route>

      {/* SURVEY-TAKER ROUTES */}
      <Route
        path="/survey"
        element={
          <ProtectedRoute requiredRole="survey-taker">
            <SurveyTakerLayout />
          </ProtectedRoute>
        }
      >
        {/* The default route and the explicit simulatedAI route both point to SimulatedAIPage */}
        <Route index element={<SimulatedAIPage />} />
        <Route path="simulatedAI" element={<SimulatedAIPage />} />
        <Route path="logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/survey" replace />} />
      </Route>

      {/* Fallback Route: Redirect any unknown paths to the login page */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Root app component with authentication context wrapper.
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;