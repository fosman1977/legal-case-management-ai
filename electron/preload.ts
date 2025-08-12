import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  selectFiles: () => ipcRenderer.invoke('file:select'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getUserDataPath: () => ipcRenderer.invoke('app:get-user-data-path'),
  restartApp: () => ipcRenderer.invoke('app:restart'),
  
  // LocalAI operations
  localAI: {
    start: () => ipcRenderer.invoke('localai:start'),
    stop: () => ipcRenderer.invoke('localai:stop'),
    status: () => ipcRenderer.invoke('localai:status'),
    getModels: () => ipcRenderer.invoke('localai:get-models'),
    downloadModel: (modelName: string) => ipcRenderer.invoke('localai:download-model', modelName)
  },

  // Docker operations
  docker: {
    checkRequirements: () => ipcRenderer.invoke('docker:check-requirements'),
    install: () => ipcRenderer.invoke('docker:install'),
    startDesktop: () => ipcRenderer.invoke('docker:start-desktop'),
    pullLocalAI: () => ipcRenderer.invoke('docker:pull-localai'),
    startLocalAI: (modelsPath: string, port?: number) => ipcRenderer.invoke('docker:start-localai', modelsPath, port),
    installCompose: () => ipcRenderer.invoke('docker:install-compose')
  },
  
  // Setup operations
  setup: {
    complete: () => ipcRenderer.invoke('setup:complete')
  },
  
  // Event handling
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [
      'show-setup-wizard',
      'localai:download-progress',
      'docker:install-progress',
      'docker:pull-progress',
      'download-progress',
      'update-available',
      'update-downloaded',
      'menu-new-case',
      'menu-open-folder', 
      'menu-settings',
      'menu-analyze-case',
      'menu-extract-chronology',
      'menu-find-authorities',
      'menu-show-shortcuts'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  
  // Menu events (legacy support)
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
  },
  
  // Auto-updater operations
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install')
  },
  
  // IPC invoke (general purpose)
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      'localai:start', 'localai:stop', 'localai:status', 'localai:get-models', 'localai:download-model',
      'setup:complete', 'app:get-version', 'app:get-user-data-path', 'app:restart',
      'file:select', 'show-open-dialog', 'show-save-dialog',
      'updater:check-for-updates', 'updater:download-update', 'updater:quit-and-install'
    ];
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      showOpenDialog: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      selectFiles: () => Promise<string[]>;
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      restartApp: () => Promise<void>;
      
      localAI: {
        start: () => Promise<boolean>;
        stop: () => Promise<boolean>;
        status: () => Promise<any>;
        getModels: () => Promise<any>;
        downloadModel: (modelName: string) => Promise<boolean>;
      };

      docker: {
        checkRequirements: () => Promise<any>;
        install: () => Promise<boolean>;
        startDesktop: () => Promise<boolean>;
        pullLocalAI: () => Promise<boolean>;
        startLocalAI: (modelsPath: string, port?: number) => Promise<boolean>;
        installCompose: () => Promise<boolean>;
      };
      
      setup: {
        complete: () => Promise<boolean>;
      };
      
      updater: {
        checkForUpdates: () => Promise<boolean>;
        downloadUpdate: () => Promise<boolean>;
        quitAndInstall: () => Promise<boolean>;
      };
      
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener: (channel: string, callback: (...args: any[]) => void) => void;
      onMenuAction: (callback: (event: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}