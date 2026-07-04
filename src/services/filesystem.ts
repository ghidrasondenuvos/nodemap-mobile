import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import JSZip from 'jszip';

// Helper to determine if we are on native mobile or web
export const isNative = Capacitor.isNativePlatform();

// Use Documents directory on iOS/Android, and Data on Web
const BASE_DIR = isNative ? Directory.Documents : Directory.Data;
const VAULT_FOLDER = 'NodeMapVault';

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  preview: string;
}

// Initialize Vault
export async function initVault() {
  try {
    await Filesystem.mkdir({
      path: VAULT_FOLDER,
      directory: BASE_DIR,
      recursive: true,
    });
  } catch (e) {
    // Folder likely already exists
  }
  
  // Initialize starter notes if first time
  const initialized = localStorage.getItem('nodemap_initialized');
  if (!initialized) {
    const welcomeNote = `# Welcome to NodeMap\n\nA tactile, beautifully designed, local-first knowledge vault.\n\n## Features\n- **Analog Aesthetic**: Warm sepia tones and film grain.\n- **Graph View**: Connect your thoughts with [[Links]].\n- **Privacy**: Everything is stored locally on your device.\n\nEnjoy writing!`;
    const howToNote = `# How to Use\n\n1. Tap the pencil icon to create a note.\n2. Link notes by typing \`[[Note Title]]\`.\n3. Check the graph view to see connections.\n4. Export everything as a .zip in Settings.`;
    
    await saveNote('Welcome to NodeMap.md', welcomeNote);
    await saveNote('How to Use NodeMap.md', howToNote);
    
    localStorage.setItem('nodemap_initialized', 'true');
  }
}

// List all notes
export async function getNotes(): Promise<Note[]> {
  try {
    const result = await Filesystem.readdir({
      path: VAULT_FOLDER,
      directory: BASE_DIR,
    });

    const notes: Note[] = [];
    for (const file of result.files) {
      if (file.name.endsWith('.md')) {
        const stat = await Filesystem.stat({
          path: `${VAULT_FOLDER}/${file.name}`,
          directory: BASE_DIR,
        });
        
        const content = await Filesystem.readFile({
          path: `${VAULT_FOLDER}/${file.name}`,
          directory: BASE_DIR,
          encoding: Encoding.UTF8,
        });

        const textContent = content.data as string;
        
        notes.push({
          id: file.name,
          title: file.name.replace('.md', ''),
          content: textContent,
          lastModified: stat.mtime || Date.now(),
          preview: textContent.substring(0, 100).replace(/#/g, '').trim() + '...',
        });
      }
    }
    
    // Sort by most recently modified
    return notes.sort((a, b) => b.lastModified - a.lastModified);
  } catch (e) {
    console.error("Error reading notes", e);
    return [];
  }
}

// Read single note
export async function readNote(id: string): Promise<Note | null> {
  try {
    const stat = await Filesystem.stat({
      path: `${VAULT_FOLDER}/${id}`,
      directory: BASE_DIR,
    });
    
    const content = await Filesystem.readFile({
      path: `${VAULT_FOLDER}/${id}`,
      directory: BASE_DIR,
      encoding: Encoding.UTF8,
    });

    return {
      id,
      title: id.replace('.md', ''),
      content: content.data as string,
      lastModified: stat.mtime || Date.now(),
      preview: (content.data as string).substring(0, 100).replace(/#/g, '').trim() + '...',
    };
  } catch (e) {
    console.error("Error reading note", e);
    return null;
  }
}

// Save note
export async function saveNote(id: string, content: string) {
  try {
    await Filesystem.writeFile({
      path: `${VAULT_FOLDER}/${id}`,
      data: content,
      directory: BASE_DIR,
      encoding: Encoding.UTF8,
    });
  } catch (e) {
    console.error("Error saving note", e);
    throw e;
  }
}

// Delete note
export async function deleteNote(id: string) {
  try {
    await Filesystem.deleteFile({
      path: `${VAULT_FOLDER}/${id}`,
      directory: BASE_DIR,
    });
  } catch (e) {
    console.error("Error deleting note", e);
    throw e;
  }
}

// Export Vault as ZIP
export async function exportVault() {
  try {
    const notes = await getNotes();
    const zip = new JSZip();
    
    notes.forEach(note => {
      zip.file(note.id, note.content);
    });
    
    const zipData = await zip.generateAsync({ type: 'base64' });
    const zipFilename = `NodeMap_Vault_${new Date().toISOString().split('T')[0]}.zip`;
    
    // Save zip to a temporary location to share
    const tempPath = `temp/${zipFilename}`;
    
    await Filesystem.writeFile({
      path: tempPath,
      data: zipData,
      directory: Directory.Cache,
    });
    
    const fileUri = await Filesystem.getUri({
      path: tempPath,
      directory: Directory.Cache,
    });
    
    await Share.share({
      title: 'Export NodeMap Vault',
      text: 'Here is a backup of my NodeMap vault.',
      url: fileUri.uri,
      dialogTitle: 'Save or Share Vault'
    });
    
  } catch (e) {
    console.error("Error exporting vault", e);
    throw e;
  }
}
