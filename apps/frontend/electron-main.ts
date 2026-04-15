import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.ts'),
      sandbox: true,
      devTools: false, // Disable devTools at window level
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  // Open DevTools in development only
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent opening DevTools via keyboard in production
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Block F12
      if (input.key.toLowerCase() === 'f12') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+I (Inspector)
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+J (Console)
      if (input.control && input.shift && input.key.toLowerCase() === 'j') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+C (Element Inspector)
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+K (Console Firefox)
      if (input.control && input.shift && input.key.toLowerCase() === 'k') {
        event.preventDefault();
      }
    });
  }

  // Disable right-click context menu
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Disable file drag-drop
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // Prevent opening new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Create menu - disable in production for security
const template: Electron.MenuItemConstructorOptions[] = isDev
  ? [
      {
        label: 'File',
        submenu: [
          {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        ],
      },
    ]
  : []; // Empty menu in production

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Handle IPC for violation logging
ipcMain.on('log-violation', (event, violation) => {
  console.log('Violation logged:', violation);
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
