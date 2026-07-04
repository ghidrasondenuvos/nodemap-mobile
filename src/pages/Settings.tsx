import React from 'react';
import { exportVault, getNotes, deleteNote } from '../services/filesystem';
import { triggerHaptic } from '../utils/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { motion } from 'framer-motion';
import './Settings.css';

export const Settings: React.FC = () => {
  const handleExport = async () => {
    triggerHaptic(ImpactStyle.Medium);
    try {
      await exportVault();
      triggerHaptic(ImpactStyle.Heavy);
    } catch (e) {
      alert('Error exporting vault.');
    }
  };

  const handleClear = async () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (window.confirm("Are you sure you want to permanently delete all notes? This cannot be undone.")) {
      const notes = await getNotes();
      for (const note of notes) {
        await deleteNote(note.id);
      }
      triggerHaptic(ImpactStyle.Heavy);
      alert("Vault cleared.");
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-section">
        <h2>Data & Storage</h2>
        <motion.div className="settings-card glass" whileTap={{ scale: 0.98 }}>
          <div className="setting-info">
            <h3>Export Vault</h3>
            <p>Backup as a ZIP file.</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="action-btn" onClick={handleExport}>
            Export
          </motion.button>
        </motion.div>

        <motion.div className="settings-card glass" whileTap={{ scale: 0.98 }}>
          <div className="setting-info">
            <h3>Clear Vault</h3>
            <p>Delete all notes.</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="action-btn danger-btn" onClick={handleClear}>
            Clear
          </motion.button>
        </motion.div>
      </div>
      
      <div className="settings-section">
        <h2>About</h2>
        <p className="about-text">
          NodeMap is a premium, local-first knowledge management vault. 
          Built with an analog aesthetic to bring tactile warmth back to software.
        </p>
      </div>
    </div>
  );
};
