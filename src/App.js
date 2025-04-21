// Root-level React app file. Defines all frontend routes and wraps them in authentication logic.
// If you need to add new pages or change access control rules, this is where routing behavior starts.

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Auth and access control
import { AuthProvider } from './contexts/AuthContext';  // Provides user context to all children
import ProtectedRoute from './ProtectedRoute';          // Restricts route access to logged-in users

// Standalone public pages (no auth needed)
import SignUp from './SignUp';
import SignIn from './SignIn';
import Survey from './Survey'; // Participant survey page

// Authenticated app views
import SimulatedAIPage from './SimulatedAIPage';         // AI simulation experience for participants

// Layout shells (used to wrap route groups with navigation/sidebars)
import AdminLayout from './AdminLayout';                 // Used for admin panel routes
import ResearcherLayout from './ResearcherLayout';       // Used for researcher panel routes
import SurveyTakerLayout from './SurveyTakerLayout';     // Used for profile view of survey takers

// Pages loaded inside layouts
import Dashboard from './Dashboard';                     // Shared dashboard for Admin/Researcher
import GroupSettings from './GroupSettings';             // Group configuration tool
import UserRoleManagement from './UserRoleManagement';   // Admin-only: manage user roles
import ManageResearchers from './ManageResearchers';     // (Not currently used; candidate for removal/refactor)
import Closed from './Closed';                           // Fallback screen if survey is unavailable
import UserProfile from './UserProfile';                 // Profile view for survey takers

function App() {
  return (
    <Router>
      {/* AuthProvider gives access to `currentUser`, `logIn`, `logOut`, etc. throughout the app */}
      <AuthProvider>
        <Routes>
          {/* === Public Routes === */}
          {/* If adding other non-auth routes like /about or /faq, place them here */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/survey" element={<Survey />} />

          {/* === Standalone Protected Routes === */}
          {/* To make a new private page, wrap it in <ProtectedRoute> like below */}
          <Route
            path="/simulated-ai"
            element={
              <ProtectedRoute>
                <SimulatedAIPage />
              </ProtectedRoute>
            }
          />

          {/* === Admin Section (accessed by users with role=admin) === */}
          {/* Add new admin tools by nesting a new <Route path="new-tool" element={<Component />} /> here */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="group-settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
            <Route path="manage-roles" element={<ProtectedRoute><UserRoleManagement /></ProtectedRoute>} />
          </Route>

          {/* === Researcher Section (accessed by users with role=researcher) === */}
          {/* Note: Researchers see a limited subset of admin pages */}
          <Route path="/researcher" element={<ResearcherLayout />}>
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="group-settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
          </Route>

          {/* === Survey Taker Area (minimal UI, just a profile for now) === */}
          {/* If expanding user features, add new pages here */}
          <Route path="/profile" element={<SurveyTakerLayout />}>
            <Route index element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          </Route>

          {/* === Fallback: Survey closed */}
          {/* Triggered when survey is marked closed in backend */}
          <Route path="/survey/closed" element={<Closed />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
