import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { DockerManager } from './dockerManager';

const isDev = process.env.NODE_ENV === 'development';

// LocalAI Integration Manager
class LocalAIManager extends EventEmitter {
  private localaiProcess: ChildProcess | null = null;
  private isRunning = false;
  private config = {
    port: 8080,
    modelsPath: path.join(app.getPath('userData'), 'models'),
    binPath: path.join(app.getPath('userData'), 'localai'),
    selectedModel: 'mistral-7b-instruct-legal'
  };

  constructor() {
    super();
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.config.modelsPath)) {
      fs.mkdirSync(this.config.modelsPath, { recursive: true });
    }
    if (!fs.existsSync(this.config.binPath)) {
      fs.mkdirSync(this.config.binPath, { recursive: true });
    }
  }

  async downloadBinary(): Promise<boolean> {
    const platform = process.platform;
    const arch = process.arch;
    
    const binaryUrls: { [key: string]: string } = {
      'win32-x64': 'https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Windows-x86_64.exe',
      'darwin-x64': 'https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Darwin-x86_64',
      'darwin-arm64': 'https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Darwin-arm64',
      'linux-x64': 'https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Linux-x86_64'
    };

    const key = `${platform}-${arch}`;
    const url = binaryUrls[key];
    
    if (!url) {
      throw new Error(`Unsupported platform: ${key}`);
    }

    const binaryName = platform === 'win32' ? 'localai.exe' : 'localai';
    const binaryPath = path.join(this.config.binPath, binaryName);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(binaryPath, buffer);
      
      if (platform !== 'win32') {
        fs.chmodSync(binaryPath, '755');
      }

      return true;
    } catch (error) {
      console.error('Failed to download LocalAI binary:', error);
      return false;
    }
  }

  async start(): Promise<boolean> {
    if (this.isRunning) return true;

    const binaryName = process.platform === 'win32' ? 'localai.exe' : 'localai';
    const binaryPath = path.join(this.config.binPath, binaryName);

    if (!fs.existsSync(binaryPath)) {
      console.log('LocalAI binary not found, downloading...');
      const downloaded = await this.downloadBinary();
      if (!downloaded) return false;
    }

    return new Promise((resolve) => {
      this.localaiProcess = spawn(binaryPath, [
        '--address', `0.0.0.0:${this.config.port}`,
        '--models-path', this.config.modelsPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.config.binPath
      });

      this.localaiProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`LocalAI stdout: ${output}`);
        if (output.includes('API server listening') || output.includes('Fiber v')) {
          this.isRunning = true;
          this.emit('ready');
          resolve(true);
        }
      });

      this.localaiProcess.stderr?.on('data', (data) => {
        console.error(`LocalAI stderr: ${data}`);
      });

      this.localaiProcess.on('close', (code) => {
        console.log(`LocalAI process exited with code ${code}`);
        this.isRunning = false;
        this.localaiProcess = null;
        this.emit('stopped');
      });

      setTimeout(() => {
        if (!this.isRunning) {
          this.stop();
          resolve(false);
        }
      }, 30000);
    });
  }

  stop() {
    if (this.localaiProcess) {
      this.localaiProcess.kill();
      this.localaiProcess = null;
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.config.port,
      modelsPath: this.config.modelsPath,
      selectedModel: this.config.selectedModel
    };
  }

  getAvailableModels() {
    return {
      'mistral-7b-instruct-legal': {
        name: 'Mistral 7B Instruct (Legal Optimized)',
        size: '4.1GB',
        description: 'Best for legal document analysis and case preparation',
        recommended: true,
        useCase: 'Document analysis, contract review, case summarization',
        config: {
          name: 'mistral-7b-instruct-legal',
          parameters: {
            model: 'mistral-7b-instruct-v0.2.Q4_K_M.gguf'
          }
        }
      },
      'llama2-13b-legal': {
        name: 'Llama 2 13B (Legal Fine-tuned)', 
        size: '7.3GB',
        description: 'Excellent for complex legal reasoning and contract analysis',
        recommended: true,
        useCase: 'Complex legal reasoning, precedent analysis, brief writing',
        config: {
          name: 'llama2-13b-legal',
          parameters: {
            model: 'llama-2-13b-chat.Q4_K_M.gguf'
          }
        }
      },
      'phi3-legal': {
        name: 'Phi-3 Medium (Legal Specialized)',
        size: '2.4GB', 
        description: 'Fast and efficient for document summarization',
        recommended: false,
        useCase: 'Quick document summaries, basic legal Q&A',
        config: {
          name: 'phi3-legal',
          parameters: {
            model: 'Phi-3-medium-4k-instruct-q4.gguf'
          }
        }
      }
    };
  }

  async downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    const modelUrls: { [key: string]: string } = {
      'mistral-7b-instruct-legal': 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      'llama2-13b-legal': 'https://huggingface.co/TheBloke/Llama-2-13B-Chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf',
      'phi3-legal': 'https://huggingface.co/microsoft/Phi-3-medium-4k-instruct-gguf/resolve/main/Phi-3-medium-4k-instruct-q4.gguf'
    };

    const url = modelUrls[modelName];
    if (!url) return false;

    const fileName = url.split('/').pop() || `${modelName}.gguf`;
    const modelPath = path.join(this.config.modelsPath, fileName);
    
    if (fs.existsSync(modelPath)) {
      console.log(`Model ${modelName} already exists`);
      return true;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) return false;

      const total = parseInt(response.headers.get('content-length') || '0');
      let downloaded = 0;

      const writer = fs.createWriteStream(modelPath);
      const reader = response.body?.getReader();
      
      if (!reader) return false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        downloaded += value.length;
        writer.write(value);
        
        if (onProgress && total > 0) {
          onProgress((downloaded / total) * 100);
        }
      }

      writer.end();
      
      // Create model config file
      const configPath = path.join(this.config.modelsPath, `${modelName}.yaml`);
      const modelConfig = `
name: ${modelName}
parameters:
  model: ${fileName}
  temperature: 0.7
  top_p: 0.9
  max_tokens: 2048
`;
      fs.writeFileSync(configPath, modelConfig);
      
      return true;
    } catch (error) {
      console.error('Model download failed:', error);
      return false;
    }
  }
}

let mainWindow: BrowserWindow;
// let tray: Tray | null = null; // Disabled for simplified build
let localAI: LocalAIManager;
let dockerManager: DockerManager;
let isQuitting = false;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    // icon: path.join(__dirname, '../assets/icon.png'), // Icon optional for now
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.focus();
    }
    
    // Check for first-time setup
    checkFirstTimeSetup();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && process.platform === 'darwin') {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// Create application menu
const createMenu = () => {
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Case',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-case');
          }
        },
        {
          label: 'Open Case Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-folder');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Analyze Current Case',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.send('menu-analyze-case');
          }
        },
        {
          label: 'Extract Chronology',
          click: () => {
            mainWindow.webContents.send('menu-extract-chronology');
          }
        },
        {
          label: 'Find Legal Authorities',
          click: () => {
            mainWindow.webContents.send('menu-find-authorities');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: async () => {
            try {
              console.log('Manually checking for updates...');
              const result = await autoUpdater.checkForUpdatesAndNotify();
              console.log('Update check result:', result);
              
              // If no result or no update available, show message
              if (!result || !result.updateInfo) {
                setTimeout(() => {
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'No Updates Available',
                    message: 'You are running the latest version.',
                    buttons: ['OK']
                  });
                }, 1000); // Wait a bit for the check to complete
              }
            } catch (error) {
              console.error('Update check failed:', error);
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update Check Failed',
                message: 'Unable to check for updates. Please try again later.',
                detail: error.message,
                buttons: ['OK']
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About Legal Case Manager',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Legal Case Manager',
              message: `Legal Case Manager v${app.getVersion()}`,
              detail: 'AI-powered legal case preparation and document analysis tool.\n\nBuilt with Electron, React, and Ollama.'
            });
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow.webContents.send('menu-show-shortcuts');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Setup functions
// const setupTray = () => {
//   // Skip tray setup for now to avoid missing icon issues
//   console.log('Tray setup skipped - no icons available');
//   // TODO: Add proper tray icons and re-enable tray functionality
// };

const setupAutoUpdater = () => {
  // Configure auto-updater
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false; // Don't auto-download, ask user first
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Set update server URL (GitHub releases)
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'fosman1977',
    repo: 'legal-case-management-ai',
    releaseType: 'release'
  });
  
  // Only check for updates in production
  if (!isDev && app.isPackaged) {
    // Check for updates on startup (after 10 seconds to let app fully load)
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Auto-update check failed:', err);
      });
    }, 10000);
    
    // Check for updates every 6 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Periodic update check failed:', err);
      });
    }, 6 * 60 * 60 * 1000);
  } else {
    console.log('Auto-updater disabled in development mode');
  }
  
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    
    const response = dialog.showMessageBoxSync(mainWindow!, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download and install it now? The app will restart automatically after the update.',
      buttons: ['Download & Install', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version:', app.getVersion());
    
    // If this was triggered by a manual check, we can show a message
    // The manual check will handle showing the "no updates" dialog
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    
    // Don't show error dialog if it's just missing update files
    if (err.message && (err.message.includes('latest-mac.yml') || err.message.includes('latest.yml'))) {
      console.log('No published releases found - this is normal for development');
      return;
    }
    
    // Only show critical errors to users
    if (mainWindow && !err.message.includes('net::ERR_')) {
      dialog.showErrorBox('Update Error', 
        'There was a problem checking for updates. Please check your internet connection.');
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
    log_message += ` - Downloaded ${progressObj.percent}%`;
    log_message += ` (${progressObj.transferred}/${progressObj.total})`;
    console.log(log_message);
    
    // Send progress to renderer
    mainWindow?.webContents.send('download-progress', {
      percent: Math.round(progressObj.percent),
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  });
  
  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded');
    
    const response = dialog.showMessageBoxSync(mainWindow!, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully.',
      detail: 'The application will restart now to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
};

const checkFirstTimeSetup = async () => {
  const configPath = path.join(app.getPath('userData'), 'setup-complete.json');
  
  if (!fs.existsSync(configPath)) {
    mainWindow?.webContents.send('show-setup-wizard');
  }
};

// const showLocalAIStatus = () => {
//   const status = localAI.getStatus();
//   const message = status.isRunning 
//     ? `LocalAI is running on port ${status.port}\nModel: ${status.selectedModel}`
//     : 'LocalAI is not running';
  
//   dialog.showMessageBox(mainWindow!, {
//     type: 'info',
//     title: 'LocalAI Status',
//     message,
//     buttons: ['OK']
//   });
// };

// App event handlers
app.whenReady().then(() => {
  localAI = new LocalAIManager();
  dockerManager = new DockerManager();
  createWindow();
  createMenu();
  // setupTray(); // Disabled until proper icons are available
  setupAutoUpdater();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  localAI?.stop();
});

// IPC handlers
const registerIpcHandlers = () => {
  // LocalAI Management
  ipcMain.handle('localai:start', async () => {
    return await localAI.start();
  });

  ipcMain.handle('localai:stop', () => {
    localAI.stop();
    return true;
  });

  ipcMain.handle('localai:status', () => {
    return localAI.getStatus();
  });

  ipcMain.handle('localai:get-models', () => {
    return localAI.getAvailableModels();
  });

  ipcMain.handle('localai:download-model', async (_event, modelName) => {
    return new Promise((resolve) => {
      localAI.downloadModel(modelName, (progress) => {
        _event.sender.send('localai:download-progress', { modelName, progress });
      }).then(resolve);
    });
  });

  // File Operations
  ipcMain.handle('file:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'docx', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result.filePaths;
  });

  ipcMain.handle('show-open-dialog', async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('show-save-dialog', async (_event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  // App Operations  
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-platform', () => process.platform);
  ipcMain.handle('app:get-user-data-path', () => app.getPath('userData'));
  ipcMain.handle('app:restart', () => app.relaunch());
  
  // Auto-updater operations
  ipcMain.handle('updater:check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify();
    return true;
  });
  
  ipcMain.handle('updater:download-update', () => {
    autoUpdater.downloadUpdate();
    return true;
  });
  
  ipcMain.handle('updater:quit-and-install', () => {
    autoUpdater.quitAndInstall();
    return true;
  });

  // Docker Management
  ipcMain.handle('docker:check-requirements', async () => {
    return await dockerManager.checkSystemRequirements();
  });

  ipcMain.handle('docker:install', async (_event) => {
    return new Promise((resolve) => {
      dockerManager.installDocker((status, progress) => {
        _event.sender.send('docker:install-progress', { status, progress });
      }).then(resolve);
    });
  });

  ipcMain.handle('docker:start-desktop', async () => {
    return await dockerManager.startDockerDesktop();
  });

  ipcMain.handle('docker:pull-localai', async (_event) => {
    return new Promise((resolve) => {
      dockerManager.pullLocalAIImage((status, progress) => {
        _event.sender.send('docker:pull-progress', { status, progress });
      }).then(resolve);
    });
  });

  ipcMain.handle('docker:start-localai', async (_event, modelsPath, port) => {
    return await dockerManager.startLocalAIContainer(modelsPath, port);
  });

  ipcMain.handle('docker:install-compose', async () => {
    return await dockerManager.installDockerCompose();
  });

  // Setup Operations
  ipcMain.handle('setup:complete', async () => {
    const configPath = path.join(app.getPath('userData'), 'setup-complete.json');
    const config = {
      completed: true,
      completedAt: new Date().toISOString(),
      version: app.getVersion()
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  });
};

// Handle app updates and notifications
app.on('ready', () => {
  console.log('🚀 Legal Case Manager started');
  
  // Check if Ollama is available
  // We'll implement this check in the renderer process
});