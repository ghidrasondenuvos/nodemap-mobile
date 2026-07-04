import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { readNote, saveNote, deleteNote } from '../services/filesystem';
import { CaretLeft, Trash } from '@phosphor-icons/react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { ImpactStyle } from '@capacitor/haptics';
import { motion } from 'framer-motion';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import './Editor.css';

interface EditorProps {
  isNew?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ isNew = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize BlockNote
  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadNote = async () => {
      if (isNew) {
        setTitle('Untitled');
        setIsLoaded(true);
      } else if (id) {
        const decodedId = decodeURIComponent(id);
        const note = await readNote(decodedId);
        if (note) {
          setTitle(note.title);
          
          if (note.content) {
            // Attempt to load blocks from markdown
            const blocks = await editor.tryParseMarkdownToBlocks(note.content);
            editor.replaceBlocks(editor.document, blocks);
          }
          setIsLoaded(true);
        } else {
          navigate('/');
        }
      }
    };
    loadNote();
  }, [id, isNew, navigate, editor]);

  const handleSave = async () => {
    if (!editor) return;
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    
    // Ensure filename ends with .md
    const filename = `${title.trim() || 'Untitled'}.md`;
    await saveNote(filename, markdown);
    playSound('success');
  };

  const handleDelete = async () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (window.confirm('Delete this note?')) {
      if (!isNew && id) {
        await deleteNote(decodeURIComponent(id));
      }
      playSound('swoosh');
      navigate('/');
    }
  };

  return (
    <div className="editor-page">
      <header className="editor-header glass">
        <motion.button whileTap={{ scale: 0.85 }} className="icon-btn" onClick={() => { triggerHaptic(ImpactStyle.Light); playSound('click'); handleSave(); navigate('/'); }}>
          <CaretLeft size={28} />
        </motion.button>
        <input 
          className="title-input" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          placeholder="Note Title"
        />
        <motion.button whileTap={{ scale: 0.85 }} className="icon-btn delete-btn" onClick={handleDelete}>
          <Trash size={24} />
        </motion.button>
      </header>

      <div className="editor-content">
        {isLoaded && (
          <BlockNoteView 
            editor={editor} 
            theme="light" // Ideally we customize this with CSS variables
            onChange={handleSave}
          />
        )}
      </div>
    </div>
  );
};
