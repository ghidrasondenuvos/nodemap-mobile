import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Village } from './pages/Village';
import { Battle } from './pages/Battle';
import { initVault } from './services/filesystem';

const App = () => {
  React.useEffect(() => {
    initVault();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="*" element={<Village />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </Router>
  );
};

export default App;
