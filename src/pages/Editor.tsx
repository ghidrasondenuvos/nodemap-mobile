import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { readNote, saveNote, deleteNote } from '../services/filesystem';
import { CaretLeft, Trash, Export } from '@phosphor-icons/react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { ImpactStyle } from '@capacitor/haptics';
import { motion } from 'framer-motion';
import { Share } from '@capacitor/share';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import './Editor.css';

interface EditorProps {
  isNew?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ isNew = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentId, setCurrentId] = useState<string | undefined>(id ? decodeURIComponent(id) : undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadNote = async () => {
      if (isNew) {
        setIsLoaded(true);
      } else if (currentId) {
        const note = await readNote(currentId);
        if (note) {
          if (note.content) {
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
  }, [currentId, isNew, navigate, editor]);

  const handleSave = async () => {
    if (!editor) return;
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    
    // Apple Notes Magic: Derive title from the first line of content
    const firstLineMatch = markdown.trim().split('\n')[0] || '';
    const safeTitle = firstLineMatch.replace(/^#+\s*/, '').substring(0, 40).replace(/[^a-zA-Z0-9 \-]/g, "").trim() || 'New Note';
    const filename = `${safeTitle}.md`;

    await saveNote(filename, markdown);

    // If filename changed (i.e. first line was edited), delete old file
    if (currentId && currentId !== filename) {
      await deleteNote(currentId);
    }
    
    if (currentId !== filename) {
      setCurrentId(filename);
      navigate(`/note/${encodeURIComponent(filename)}`, { replace: true });
    }
  };

  const handleDelete = async () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (window.confirm('Delete this note?')) {
      if (currentId) {
        await deleteNote(currentId);
      }
      playSound('swoosh');
      navigate('/');
    }
  };

  const handleShare = async () => {
    if (!editor) return;
    triggerHaptic(ImpactStyle.Light);
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    await Share.share({
      title: currentId?.replace('.md', '') || 'Note',
      text: markdown,
      dialogTitle: 'Share Note'
    });
  };

  return (
    <div className="editor-page">
      <header className="editor-header glass">
        <motion.button whileTap={{ scale: 0.9 }} className="ios-back-btn" onClick={() => { triggerHaptic(ImpactStyle.Light); playSound('click'); handleSave(); navigate('/'); }}>
          <CaretLeft size={24} weight="bold" />
          <span>Notes</span>
        </motion.button>
        
        <div className="header-actions">
          <motion.button whileTap={{ scale: 0.85 }} className="icon-btn" onClick={handleShare}>
            <Export size={22} weight="regular" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} className="icon-btn delete-btn" onClick={handleDelete}>
            <Trash size={22} weight="regular" />
          </motion.button>
        </div>
      </header>

      <div 
        className="editor-content" 
        onClick={() => (editor?._tiptapEditor as any)?.commands?.focus('end')}
        style={{ minHeight: '100%', cursor: 'text' }}
      >
        {isLoaded && (
          <BlockNoteView 
            editor={editor} 
            theme="light" 
            onChange={handleSave}
          />
        )}
      </div>
    </div>
  );
};
