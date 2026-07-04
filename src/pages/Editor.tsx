import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { readNote, saveNote, deleteNote, getNotes } from '../services/filesystem';
import type { Note } from '../services/filesystem';
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
  const [allNotes, setAllNotes] = useState<Note[]>([]);

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

      // Fetch all notes for backlinks feature
      const vaultNotes = await getNotes();
      setAllNotes(vaultNotes);
    };
    loadNote();
  }, [currentId, isNew, navigate, editor]);

  // Compute backlinks and unlinked mentions
  const networkContext = useMemo(() => {
    if (!currentId) return { linked: [], unlinked: [] };
    const titleWithoutExt = currentId.replace('.md', '');
    const linked: { id: string, title: string, snippet: string }[] = [];
    const unlinked: { id: string, title: string, snippet: string }[] = [];

    allNotes.forEach(n => {
      if (n.id === currentId) return; // Skip self
      
      const content = n.content || n.preview || '';
      const explicitMatch = content.includes(`[[${titleWithoutExt}]]`);
      const unlinkedMatch = !explicitMatch && content.toLowerCase().includes(titleWithoutExt.toLowerCase());

      if (explicitMatch || unlinkedMatch) {
        // Extract a clean snippet
        const index = content.toLowerCase().indexOf(titleWithoutExt.toLowerCase());
        const snippet = content.substring(Math.max(0, index - 30), Math.min(content.length, index + titleWithoutExt.length + 30)).trim();
        
        if (explicitMatch) linked.push({ id: n.id, title: n.title.replace('.md',''), snippet });
        else unlinked.push({ id: n.id, title: n.title.replace('.md',''), snippet });
      }
    });

    return { linked, unlinked };
  }, [allNotes, currentId]);

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
        style={{ minHeight: '100%', cursor: 'text', paddingBottom: 150 }}
      >
        {isLoaded && (
          <BlockNoteView 
            editor={editor} 
            theme="light" 
            onChange={handleSave}
          />
        )}

        {/* PREMIUM APPLE-NOTES STYLE CONTEXT PANEL */}
        {(networkContext.linked.length > 0 || networkContext.unlinked.length > 0) && (
          <div style={{ 
            marginTop: 40, 
            paddingTop: 32, 
            borderTop: '1px solid rgba(51, 42, 36, 0.1)', 
            paddingLeft: 50,
            paddingRight: 24,
            opacity: 0.9
          }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--color-ink-light)', fontWeight: 600, marginBottom: 16 }}>
              Related Notes
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {networkContext.linked.map(link => (
                <div 
                  key={link.id} 
                  onClick={(e) => { e.stopPropagation(); navigate(`/note/${encodeURIComponent(link.id)}`); }}
                  style={{ 
                    padding: 16, 
                    background: 'var(--color-card)', 
                    borderRadius: 16, 
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ background: 'var(--color-accent)', width: 6, height: 6, borderRadius: '50%' }} />
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: 15 }}>{link.title}</div>
                  </div>
                  <div style={{ color: 'var(--color-ink-light)', fontSize: 14, lineHeight: 1.4, paddingLeft: 14 }}>
                    "...{link.snippet}..."
                  </div>
                </div>
              ))}
              
              {networkContext.unlinked.map(mention => (
                <div 
                  key={mention.id} 
                  onClick={(e) => { e.stopPropagation(); navigate(`/note/${encodeURIComponent(mention.id)}`); }}
                  style={{ 
                    padding: 16, 
                    background: 'rgba(247, 243, 235, 0.5)', 
                    borderRadius: 16, 
                    border: '1px dashed rgba(51, 42, 36, 0.15)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ border: '1px solid var(--color-ink-light)', width: 6, height: 6, borderRadius: '50%' }} />
                    <div style={{ fontWeight: 500, color: 'var(--color-ink)', fontSize: 15 }}>{mention.title} <span style={{fontSize: 12, opacity: 0.6, fontWeight: 400}}>(Unlinked Mention)</span></div>
                  </div>
                  <div style={{ color: 'var(--color-ink-light)', fontSize: 14, lineHeight: 1.4, paddingLeft: 14 }}>
                    "...{mention.snippet}..."
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
