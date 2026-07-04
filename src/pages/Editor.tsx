import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { readNote, saveNote, deleteNote } from '../services/filesystem';
import { CaretLeft, Trash } from '@phosphor-icons/react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
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
    
    // If it was a new note, we might want to clean up if the title changed, but keeping it simple for now
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      if (!isNew && id) {
        await deleteNote(decodeURIComponent(id));
      }
      navigate('/');
    }
  };

  return (
    <div className="editor-page page-transition-enter-active">
      <header className="editor-header glass">
        <button className="icon-btn" onClick={() => { handleSave(); navigate('/'); }}>
          <CaretLeft size={28} />
        </button>
        <input 
          className="title-input" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          placeholder="Note Title"
        />
        <button className="icon-btn delete-btn" onClick={handleDelete}>
          <Trash size={24} />
        </button>
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
