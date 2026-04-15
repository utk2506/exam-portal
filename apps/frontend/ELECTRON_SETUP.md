# Electron Desktop App Setup

This document explains how to build and run the Exam Portal as a desktop application for Windows and Mac.

## Files Created

- `electron-main.ts` - Main Electron process that creates and manages the application window
- `electron-preload.ts` - Preload script for secure context isolation
- `electron-builder.yml` - Configuration for building installers for Windows and Mac

## Features

✅ Full security features:
- Context isolation for security
- Sandbox enabled
- Disabled right-click menu
- Blocked drag-and-drop
- Blocked F12 DevTools in release builds
- Prevented multiple instances

✅ Platform support:
- Windows (NSIS installer & portable executable)
- macOS (DMG & ZIP distribution)

## Development

To run the desktop app in development mode:

```bash
# Terminal 1: Start the Vite dev server
npm run dev

# Terminal 2: Run Electron
npm run dev:electron
```

The Electron window will connect to `http://localhost:5173` (Vite dev server).

## Building

### Build for Windows

```bash
npm run build:electron:windows
```

This creates:
- `dist_electron/Fresher Drive 2026 Setup.exe` - NSIS installer
- `dist_electron/Fresher Drive 2026.exe` - Portable executable

### Build for macOS

```bash
npm run build:electron:mac
```

This creates:
- `dist_electron/Fresher Drive 2026.dmg` - DMG installer
- `dist_electron/Fresher Drive 2026.zip` - ZIP distribution

### Build for All Platforms

```bash
npm run build:electron
```

## Configuration

### Windows-specific Settings

Edit `electron-builder.yml` to customize:
- NSIS installer options (one-click, installation directory, etc.)
- Code signing (requires .pfx certificate)
- Update behavior

### macOS-specific Settings

Edit `electron-builder.yml` to customize:
- App category
- Hardened runtime settings
- Gatekeeper assessment

## Security Considerations

The Electron app implements the following security measures:

1. **Context Isolation** - Renderer process cannot directly access Node.js APIs
2. **Preload Script** - Safe bridge between renderer and main process
3. **Sandbox** - Renderer processes run in a sandbox
4. **No Node Integration** - Disables direct Node.js access from renderer
5. **Disabled Features**:
   - Right-click context menu
   - Drag-and-drop files
   - Opening new windows
   - DevTools in production (F12, Ctrl+Shift+I)

## Distribution

### Windows

1. Users can download the installer (.exe) from your website
2. Run the installer to install the application
3. Application can be uninstalled via Control Panel > Add/Remove Programs

### macOS

1. Users can download the DMG file
2. Drag the app icon to the Applications folder
3. Launch from Applications or Spotlight search

## Troubleshooting

### DevTools Not Opening

In production builds, DevTools is disabled for security. To enable during development, uncomment the F12 line in `electron-preload.ts`.

### Code Signing for macOS

To code-sign the Mac app (optional):

1. Obtain a Developer ID Application certificate from Apple
2. Set environment variables:
   ```bash
   export APPLE_ID="your-email@example.com"
   export APPLE_ID_PASSWORD="your-app-password"
   export TEAM_ID="XXXXXXXXXX"
   ```
3. Update electron-builder.yml with signing details

### Code Signing for Windows

To code-sign the Windows app (optional):

1. Obtain a code signing certificate (.pfx)
2. Update electron-builder.yml:
   ```yaml
   win:
     certificateFile: path/to/certificate.pfx
     certificatePassword: your-password
   ```

## Next Steps

1. Build and test on Windows and macOS
2. Create installer distribution channels
3. Setup auto-update system (optional)
4. Monitor application crashes and errors
5. Collect feedback from users

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
