// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all the pages we just created
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateDocument from './pages/CreateDocument';
import Settings_Page from './pages/Settings';

// Import global styles (Tailwind)
import './styles/globals.css'; 

// --- NEW: Auth Context Provider ---
import { AuthProvider, useAuth } from './context/AuthContext';

// --- Helper Component to Protect Routes ---
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" replace />;
  return children;
};

// --- Helper Component to Redirect Logged In Users ---
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans text-gray-900 antialiased">
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings_Page /></ProtectedRoute>} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;