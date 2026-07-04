import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Gallery } from './pages/Gallery';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Graph } from './pages/Graph';
import { Dock } from './components/Dock';
import { initVault } from './services/filesystem';

// A wrapper to enable AnimatePresence to track route changes
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
            <Gallery />
          </motion.div>
        } />
        <Route path="/graph" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
            <Graph />
          </motion.div>
        } />
        <Route path="/note/:id" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
            <Editor />
          </motion.div>
        } />
        <Route path="/new" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
            <Editor isNew={true} />
          </motion.div>
        } />
        <Route path="/settings" element={
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
            <Settings />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    initVault();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <AnimatedRoutes />
        <Dock />
      </div>
    </Router>
  );
}

export default App;
