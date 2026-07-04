import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotes } from '../services/filesystem';
import type { Note } from '../services/filesystem';
import './Gallery.css';

export const Gallery: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
    };
    fetchNotes();
  }, []);

  return (
    <div className="gallery-page page-transition-enter-active">
      <header className="gallery-header">
        <h1>NodeMap</h1>
        <p>Your local vault</p>
      </header>

      {notes.length === 0 ? (
        <div className="empty-state">
          <p>Your vault is empty.</p>
          <button className="create-btn glass" onClick={() => navigate('/new')}>
            Create your first note
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div 
              key={note.id} 
              className="note-card"
              onClick={() => navigate(`/note/${encodeURIComponent(note.id)}`)}
            >
              <h3>{note.title}</h3>
              <p className="preview">{note.preview}</p>
              <span className="date">
                {new Date(note.lastModified).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
