// App.js
import React from 'react';

import './styles/global.css'
import WriterPage from './pages/Writer';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/Homepage';
import LogInPage from './context/loginpage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './components/SettingsPage';
import DemoPage from './pages/DemoPage';
import Research from './pages/Research';
import GenBank from './pages/GenBank';
import { AnimatePresence, motion } from 'framer-motion';
import GeneralSearch from './pages/GeneralSearch';
import Mafft from './pages/Mafft';
import ToolsPage from './pages/ToolsPage';
import Blast from './pages/Blast';
import Phylo from './pages/Phylo';
import Protein from './pages/Protein';
import FigureExplanation from './pages/FigureExplanation';
import SemanticSearch from './pages/SemanticSearch';
import Summarize from './pages/Summarize';
const pageVariants = {
  initial: {
    opacity: 0, // Start fully transparent
  },
  in: {
    opacity: 1, // Fade in to fully opaque
  },
  out: {
    opacity: 0, // Fade out to fully transparent
  }
};

const pageTransition = {
  type: "tween",
  duration: 0.2, // Shorter duration for a quick blink effect
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

const App = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing Page / Home Route */}
          <Route path="/" element={
            <AnimatedRoute>
              {currentUser ? <Navigate to="/Homepage" /> : <LandingPage />}
            </AnimatedRoute>
          } />

          {/* Authentication Routes */}
          <Route path="/login" element={<AnimatedRoute><LogInPage /></AnimatedRoute>} />

          {/* Main Application Routes */}
          <Route path="/Homepage" element={
            <AnimatedRoute>
              {currentUser ? <HomePage /> : <Navigate to="/" />}
            </AnimatedRoute>
          } />
          <Route path="/writer" element={<AnimatedRoute><WriterPage /></AnimatedRoute>} />
          <Route path="/settings" element={<AnimatedRoute><SettingsPage /></AnimatedRoute>} />

          {/* Research and Search Routes */}
          <Route path="/research" element={<AnimatedRoute><Research /></AnimatedRoute>} />
          <Route path="/genbank-search" element={<AnimatedRoute><GenBank /></AnimatedRoute>} />
          <Route path="/general-search" element={<AnimatedRoute><GeneralSearch /></AnimatedRoute>} />
          <Route path="/semantic-search" element={<AnimatedRoute><SemanticSearch /></AnimatedRoute>} />
          <Route path="/figure-explanation" element={<AnimatedRoute><FigureExplanation /></AnimatedRoute>} />
          <Route path="/summarize" element={<AnimatedRoute><Summarize /></AnimatedRoute>} />
          {/* Bioinformatics Tools Routes */}
          <Route path="/tools" element={<AnimatedRoute><ToolsPage /></AnimatedRoute>} />
          <Route path="/mafft" element={<AnimatedRoute><Mafft /></AnimatedRoute>} />
          <Route path="/blast" element={<AnimatedRoute><Blast /></AnimatedRoute>} />
          <Route path="/phylo" element={<AnimatedRoute><Phylo /></AnimatedRoute>} />
          <Route path="/protein" element={<AnimatedRoute><Protein /></AnimatedRoute>} />

          {/* Miscellaneous Routes */}
          <Route path="/demo" element={<AnimatedRoute><DemoPage /></AnimatedRoute>} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
