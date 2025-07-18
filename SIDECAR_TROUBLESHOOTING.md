# Sidecar Binary Troubleshooting Guide

## Issue Overview

### Error: "Scoped command binaries/breeding-path not found"

This error occurs when Tauri cannot locate the expected sidecar binary. The most common cause is a mismatch between the configured binary name and the actual binary file name.

## Root Causes

1. **Binary Naming Mismatch**: Configuration expects `binaries/breeding-path` but file is named `binaries/breeding-path-x86_64-pc-windows-msvc.exe`
2. **Missing Binary**: The binary hasn't been built or is in the wrong location
3. **Configuration Error**: Tauri configuration doesn't match the actual binary name
4. **Platform-Specific Issues**: Binary extensions and naming conventions vary by platform

## Quick Fix (Already Applied)

✅ **The issue has been resolved by**:

1. Creating a properly named binary: `binaries/breeding-path.exe`
2. Updating `tauri.conf.json` to reference `binaries/breeding-path.exe`
3. Updating `capabilities/default.json` permissions
4. Updating frontend code in `App.tsx`

## Debugging Steps

### 1. Verify Binary Exists
```bash
cd src-tauri
ls -la binaries/
```

### 2. Test Binary Functionality
```bash
# Windows
./binaries/breeding-path.exe --help

# Linux/Mac
./binaries/breeding-path --help
```

### 3. Check Configuration Alignment
Ensure these match:
- `tauri.conf.json` → `bundle.externalBin`
- `capabilities/default.json` → `permissions.shell:allow-execute.allow.name`
- Frontend code → `Command.sidecar()` call

### 4. Validate Platform Naming
- **Windows**: `breeding-path.exe`
- **Linux**: `breeding-path`
- **macOS**: `breeding-path`

## Build Automation

### Automated Build Script

Use the provided build script for future binary updates:

```bash
npm run build-sidecar
```

This script:
1. Determines the target platform automatically
2. Runs PyInstaller with the correct spec file
3. Copies the generated binary to the correct location with proper naming
4. Tests the binary functionality

### Manual Build Process

If you need to rebuild the binary manually:

```bash
cd src-tauri

# 1. Build with PyInstaller
pyinstaller breeding-path-x86_64-pc-windows-msvc.spec --noconfirm

# 2. Copy to correct location (Windows)
cp dist/breeding-path-x86_64-pc-windows-msvc.exe binaries/breeding-path.exe

# 3. Test the binary
./binaries/breeding-path.exe --help
```

## Platform-Specific Notes

### Windows
- Binary must have `.exe` extension
- Configuration should reference `binaries/breeding-path.exe`
- File paths use forward slashes in Tauri config

### Linux/macOS
- No file extension required
- Configuration should reference `binaries/breeding-path`
- Ensure executable permissions: `chmod +x binaries/breeding-path`

## Configuration Files

### tauri.conf.json
```json
{
  "bundle": {
    "externalBin": [
      "binaries/breeding-path.exe"  // Windows
      // "binaries/breeding-path"   // Linux/macOS
    ]
  }
}
```

### capabilities/default.json
```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "binaries/breeding-path.exe",  // Windows
          "sidecar": true,
          "args": true
        }
      ]
    }
  ]
}
```

### Frontend (App.tsx)
```typescript
const command = Command.sidecar('binaries/breeding-path.exe', args);
```

## Common Issues and Solutions

### Issue: Binary exists but still shows "not found"
**Solution**: Check that the configuration name exactly matches the file name, including extension.

### Issue: Permission denied
**Solution**: 
- Windows: Ensure binary isn't blocked by antivirus
- Linux/macOS: Set executable permissions with `chmod +x`

### Issue: Binary works in terminal but not in Tauri
**Solution**: Verify the capabilities configuration includes the correct permissions.

### Issue: Different behavior between dev and build
**Solution**: Ensure the binary is included in the bundle configuration and exists in the build output.

## Future Maintenance

1. **When updating the Python script**: Run `npm run build-sidecar` to rebuild the binary
2. **When changing platforms**: Update configuration files for platform-specific naming
3. **When adding new arguments**: Update the capabilities configuration to allow new argument patterns

## Testing the Fix

After making changes, test the sidecar:

1. **Development**: `npm run tauri dev`
2. **Manual test**: Execute a breeding calculation in the UI
3. **Check logs**: Look for successful sidecar execution messages

## Related Files

- `src-tauri/shortest_breeding_path.py` - Python source code
- `src-tauri/breeding-path-x86_64-pc-windows-msvc.spec` - PyInstaller specification
- `src-tauri/build-sidecar.js` - Automated build script
- `src-tauri/binaries/` - Binary storage directory
- `src/App.tsx` - Frontend sidecar execution
- `src-tauri/tauri.conf.json` - Tauri configuration
- `src-tauri/capabilities/default.json` - Security permissions 