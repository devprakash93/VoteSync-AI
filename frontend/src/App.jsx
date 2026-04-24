import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VotingPortal from './pages/VotingPortal';
import VerifyVote from './pages/VerifyVote';
import ResultsPage from './pages/ResultsPage';
import ResultsList from './pages/ResultsList';
import VoterProfile from './pages/VoterProfile';
import AdminParticipation from './pages/AdminParticipation';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyVote />} />
          <Route path="/results" element={<ResultsList />} />
          <Route path="/results/:electionId" element={<ResultsPage />} />

          {/* Voter Protected Routes */}
          <Route path="/vote" element={
            <ProtectedRoute><VotingPortal /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><VoterProfile /></ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roleRequired="admin"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/participation/:electionId" element={
            <ProtectedRoute roleRequired="admin"><AdminParticipation /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
