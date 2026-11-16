// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

// Dashboards & Portals
import AdminDashboard from './admin/pages/AdminDashboard';
import FestRosterDetail from './admin/pages/FestRosterDetail';
import CoordinatorDashboard from './coordinator/pages/CoordinatorDashboard';
import TeacherDashboard from './teacher/pages/TeacherDashboard';
import StudentDashboard from './student/pages/StudentDashboard';
import JudgeDashboard from './judge/pages/JudgeDashboard';
import VolunteerDashboard from './volunteer/pages/VolunteerDashboard';
import VenueDashboard from './venue/pages/VenueDashboard';
import FoodDashboard from './food/pages/FoodDashboard';
import GrievanceDashboard from './grievance/pages/GrievanceDashboard';
import PublicLiveBoard from './public_portal/pages/PublicLiveBoard';
import JudgeResults from './admin/pages/JudgeResults';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/public-status" element={<PublicLiveBoard />} />

          {/* Admin Routes (No ID required for Super Admin) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/submissions/:festId" element={<FestRosterDetail />} />

          {/* Parameterized Role Dashboards */}
          <Route path="/coordinator/:id" element={<CoordinatorDashboard />} />
          <Route path="/teacher/:id" element={<TeacherDashboard />} />
          <Route path="/student/:id" element={<StudentDashboard />} />

          {/* Feature Dashboards */}
<Route path="/judge/:id?" element={<JudgeDashboard />} />          <Route path="/volunteer-dashboard/:id?" element={<VolunteerDashboard />} />
          <Route path="/venue" element={<VenueDashboard />} />
          <Route path="/food" element={<FoodDashboard />} />
          <Route path="/grievance" element={<GrievanceDashboard />} />
<Route path="/admin/results" element={<JudgeResults />} />
          {/* Fallback Route */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}