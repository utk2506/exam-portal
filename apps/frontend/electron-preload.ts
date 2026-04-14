import { contextBridge, ipcRenderer } from 'electron';

// Define the electronAPI interface
interface ElectronAPI {
  logViolation: (violation: any) => void;
  getVersion: () => Promise<string>;
  onAppReady: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  logViolation: (violation: any) => ipcRenderer.send('log-violation', violation),
  getVersion: () => ipcRenderer.invoke('get-version'),
  onAppReady: (callback: () => void) => ipcRenderer.on('app-ready', callback),
} as ElectronAPI);

// Disable right-click context menu
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

// Disable drag and drop
document.addEventListener('dragover', (event) => {
  event.preventDefault();
});

document.addEventListener('drop', (event) => {
  event.preventDefault();
});

// Block certain keyboard shortcuts in Electron
window.addEventListener('keydown', (event) => {
  // Block F12 (DevTools) - commented to allow during development
  // if (event.key === 'F12') {
  //   event.preventDefault();
  // }

  // Block Ctrl+Shift+I (DevTools)
  if (event.ctrlKey && event.shiftKey && event.key === 'I') {
    event.preventDefault();
  }

  // Block Alt+F4 on Windows
  if (process.platform === 'win32' && event.altKey && event.key === 'F4') {
    event.preventDefault();
  }
});

// Prevent opening new windows
window.addEventListener('beforeunload', (event) => {
  // Allow navigation but prevent accidental closes
});

// Log violations to main process
if (window.electronAPI) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    window.electronAPI?.logViolation({
      type: 'console_error',
      message: args.join(' '),
      timestamp: new Date().toISOString(),
    });
  };
}
