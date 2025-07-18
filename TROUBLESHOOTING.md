# Troubleshooting Guide

## Pal List Not Loading All Pals

### Browser Cache Clear (Recommended)
1. **Hard Refresh:**
   - Windows/Linux: `Ctrl + F5` or `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache:**
   - Press `F12` → Right-click refresh button → "Empty Cache and Hard Reload"
   - Or manually clear cache for `localhost:1420`

3. **Incognito/Private Mode:**
   - Open the app in incognito mode to bypass all cache

### Dev Server Cache Clear
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite dist
npm run tauri dev
```

### Manual Cache Clear
```bash
# Clear all possible caches
rm -rf node_modules/.vite
rm -rf dist  
rm -rf src-tauri/target
npm run build
npm run tauri dev
```

## Expected Results

- **Console logs:** Should show "Found 226 files"
- **Dropdown count:** Should show 200+ unique Pals
- **Search test:** "Anubis" should be findable
- **Variant test:** Both "Azurobe" and "Azurobe Cryst" should appear

## Common Issues

1. **Old cache:** Browser showing old version
2. **Path issues:** Assets not accessible via HTTP
3. **Build cache:** Vite serving stale JavaScript

## Debug Commands

Check if files are accessible:
```bash
# Verify Assets are in place
ls public/Assets/ | wc -l  # Should show 226

# Test a specific file
ls public/Assets/Anubis.jpg  # Should exist
``` 