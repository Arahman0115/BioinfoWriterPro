import React from 'react';
import './styles/global.css';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';

import WriterPage from './pages/Writer';
import HomePage from './pages/Homepage';
import LogInPage from './context/loginpage';
import LandingPage from './pages/LandingPage';
import Settings from './pages/Settings';
import DemoPage from './pages/DemoPage';
import Research from './pages/Research';
import GenBank from './pages/GenBank';
import Mafft from './pages/Mafft';
import ToolsPage from './pages/ToolsPage';
import Blast from './pages/Blast';
import Phylo from './pages/Phylo';
import Protein from './pages/Protein';
import FigureExplanation from './pages/FigureExplanation';
import SemanticSearch from './pages/SemanticSearch';
import Summarize from './pages/Summarize';
import Pricing from './pages/Pricing';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  duration: 0.2,
};

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const AuthenticatedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" />;
  return (
    <AppLayout>
      <AnimatedRoute>{children}</AnimatedRoute>
    </AppLayout>
  );
};

const App = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes - no sidebar */}
        <Route path="/" element={
          <AnimatedRoute>
            {currentUser ? <Navigate to="/Homepage" /> : <LandingPage />}
          </AnimatedRoute>
        } />
        <Route path="/login" element={<AnimatedRoute><LogInPage /></AnimatedRoute>} />
        <Route path="/pricing" element={<AnimatedRoute><Pricing /></AnimatedRoute>} />
        <Route path="/demo" element={<AnimatedRoute><DemoPage /></AnimatedRoute>} />

        {/* Authenticated routes - with sidebar */}
        <Route path="/Homepage" element={<AuthenticatedRoute><HomePage /></AuthenticatedRoute>} />
        <Route path="/writer" element={<AuthenticatedRoute><WriterPage /></AuthenticatedRoute>} />
        <Route path="/settings" element={<AuthenticatedRoute><Settings /></AuthenticatedRoute>} />
        <Route path="/research" element={<AuthenticatedRoute><Research /></AuthenticatedRoute>} />
        <Route path="/genbank-search" element={<AuthenticatedRoute><GenBank /></AuthenticatedRoute>} />
        <Route path="/semantic-search" element={<AuthenticatedRoute><SemanticSearch /></AuthenticatedRoute>} />
        <Route path="/figure-explanation" element={<AuthenticatedRoute><FigureExplanation /></AuthenticatedRoute>} />
        <Route path="/summarize" element={<AuthenticatedRoute><Summarize /></AuthenticatedRoute>} />
        <Route path="/tools" element={<AuthenticatedRoute><ToolsPage /></AuthenticatedRoute>} />
        <Route path="/mafft" element={<AuthenticatedRoute><Mafft /></AuthenticatedRoute>} />
        <Route path="/blast" element={<AuthenticatedRoute><Blast /></AuthenticatedRoute>} />
        <Route path="/phylo" element={<AuthenticatedRoute><Phylo /></AuthenticatedRoute>} />
        <Route path="/protein" element={<AuthenticatedRoute><Protein /></AuthenticatedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
