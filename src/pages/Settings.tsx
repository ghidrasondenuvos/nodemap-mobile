import React from 'react';
import { exportVault } from '../services/filesystem';
import './Settings.css';

export const Settings: React.FC = () => {
  const handleExport = async () => {
    try {
      await exportVault();
      alert('Vault exported successfully!');
    } catch (e) {
      alert('Error exporting vault.');
    }
  };

  return (
    <div className="settings-page page-transition-enter-active">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-section">
        <h2>Data Management</h2>
        <div className="settings-card glass">
          <div className="setting-info">
            <h3>Export Vault</h3>
            <p>Backup all your notes into a single ZIP file.</p>
          </div>
          <button className="action-btn" onClick={handleExport}>
            Export .zip
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h2>About NodeMap</h2>
        <p className="about-text">
          NodeMap is a local-first, markdown-based personal knowledge management vault.
          Designed to feel analog, warm, and tactile.
        </p>
      </div>
    </div>
  );
};
