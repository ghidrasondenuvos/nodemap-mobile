import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotes } from '../services/filesystem';
import type { Note } from '../services/filesystem';
import { motion } from 'framer-motion';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { ImpactStyle } from '@capacitor/haptics';
import { formatDistanceToNow } from 'date-fns';
import './Gallery.css';

export const Gallery: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
    };
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNoteClick = (id: string) => {
    triggerHaptic(ImpactStyle.Light);
    playSound('click');
    navigate(`/note/${encodeURIComponent(id)}`);
  };

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div>
          <h1>NodeMap</h1>
          <p>{notes.length} {notes.length === 1 ? 'note' : 'notes'} in vault</p>
        </div>
      </header>

      <div className="search-bar-container">
        <MagnifyingGlass className="search-icon" size={20} weight="bold" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search your knowledge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {notes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="empty-state"
          style={{ height: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--color-ink-light)' }}>Your vault is beautifully empty.</p>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic(ImpactStyle.Medium); playSound('swoosh'); navigate('/new'); }}
            style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '20px', background: 'var(--color-accent)', color: 'white', fontWeight: 600, border: 'none' }}
          >
            Create Note
          </motion.button>
        </motion.div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note, i) => (
            <motion.div 
              key={note.id} 
              className="note-card"
              onClick={() => handleNoteClick(note.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.96 }}
            >
              <h3>{note.title}</h3>
              <p className="preview">{note.preview}</p>
              <span className="date">
                {formatDistanceToNow(note.lastModified, { addSuffix: true })}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
