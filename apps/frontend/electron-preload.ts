import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  logViolation: (violation: any) => ipcRenderer.send('log-violation', violation),
  getVersion: () => ipcRenderer.invoke('get-version'),
  onAppReady: (callback: () => void) => ipcRenderer.on('app-ready', callback),
});

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

// Block dangerous keyboard shortcuts
window.addEventListener('keydown', (event) => {
  // Block F12 (DevTools)
  if (event.key === 'F12') {
    event.preventDefault();
  }

  // Block Ctrl+Shift+I (Inspector)
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') {
    event.preventDefault();
  }

  // Block Ctrl+Shift+J (Console)
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j') {
    event.preventDefault();
  }

  // Block Ctrl+Shift+C (Element Inspector)
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
  }

  // Block Ctrl+Shift+K (Console Firefox)
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
  }

  // Block Ctrl+Shift+M (Responsive Design)
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'm') {
    event.preventDefault();
  }

  // Block Alt+F4 on Windows (prevents app close)
  if (process.platform === 'win32' && event.altKey && event.key === 'F4') {
    event.preventDefault();
  }

  // Block Ctrl+Q (Quit on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'q') {
    event.preventDefault();
  }

  // Block Ctrl+R (Reload) during exam - allow only in dev
  if (!process.env.NODE_ENV?.includes('development') && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
    event.preventDefault();
  }

  // Block Ctrl+L (address bar)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
    event.preventDefault();
  }

  // Block Ctrl+T (new tab)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
    event.preventDefault();
  }

  // Block Ctrl+N (new window)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
  }
});

// Override window.open to prevent popup windows
const originalWindowOpen = window.open;
window.open = function() {
  return null;
};

// Prevent back/forward navigation during exam
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(state: any, title: string, url?: any) {
  // Allow navigation within the app
  if (url && typeof url === 'string') {
    if (url.includes('/exam/')) {
      return originalPushState.call(history, state, title, url);
    }
  }
  return originalPushState.call(history, state, title, url);
};

history.replaceState = function(state: any, title: string, url?: any) {
  if (url && typeof url === 'string') {
    if (url.includes('/exam/')) {
      return originalReplaceState.call(history, state, title, url);
    }
  }
  return originalReplaceState.call(history, state, title, url);
};

// Prevent back button when on exam page
window.addEventListener('beforeunload', (event) => {
  // Exam page will handle this with its own navigation guard
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
