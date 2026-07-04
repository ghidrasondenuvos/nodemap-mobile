import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Gallery } from './pages/Gallery';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Dock } from './components/Dock';
import { initVault } from './services/filesystem';

function App() {
  useEffect(() => {
    initVault();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/note/:id" element={<Editor />} />
          <Route path="/new" element={<Editor isNew={true} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Dock />
      </div>
    </Router>
  );
}

export default App;
