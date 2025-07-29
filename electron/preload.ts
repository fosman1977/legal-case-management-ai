import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Menu events
  onMenuAction: (callback: (event: string) => void) => {
    ipcRenderer.on('menu-new-case', () => callback('new-case'));
    ipcRenderer.on('menu-open-folder', () => callback('open-folder'));
    ipcRenderer.on('menu-settings', () => callback('settings'));
    ipcRenderer.on('menu-analyze-case', () => callback('analyze-case'));
    ipcRenderer.on('menu-extract-chronology', () => callback('extract-chronology'));
    ipcRenderer.on('menu-find-authorities', () => callback('find-authorities'));
    ipcRenderer.on('menu-show-shortcuts', () => callback('show-shortcuts'));
  },
  
  // Remove menu listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      showOpenDialog: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      onMenuAction: (callback: (event: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}