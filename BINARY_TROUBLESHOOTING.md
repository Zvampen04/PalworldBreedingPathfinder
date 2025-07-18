# Binary & Sidecar Troubleshooting Guide

## ✅ Current Setup Status

All Python files have been successfully built into standalone binaries:

### **Built Binaries:**
- `breeding-path.exe` - Main breeding path calculator (7.7MB)
- `fullcalc-scraper.exe` - Complete breeding data scraper (20.5MB) 
- `image-scraper.exe` - Pal image scraper (20.5MB)
- `breeding-scraper.exe` - Breeding combinations scraper (20.7MB)

### **External Data:**
- `palworld_breeding_combinations.csv` - External CSV file (can be edited)

## 🚀 Quick Test

To verify everything works:

```bash
cd src-tauri/binaries
./breeding-path.exe -p1 Chikipi -c Astegon
```

Expected output: Multiple breeding paths from Chikipi to Astegon.

## 🔧 If Tauri Still Shows "Binary Not Found"

### **1. Restart Development Server**
```bash
# Kill existing processes
pkill -f "tauri dev"

# Start fresh
npm run tauri dev
```

### **2. Verify Binary Names**
Check that these files exist in `src-tauri/binaries/`:
- `breeding-path.exe-x86_64-pc-windows-msvc.exe` ✅
- `palworld_breeding_combinations.csv` ✅

### **3. Check Configuration Files**

**src-tauri/tauri.conf.json:**
```json
"externalBin": [
  "binaries/breeding-path.exe"
]
```

**src-tauri/capabilities/default.json:**
```json
{
  "name": "binaries/breeding-path.exe",
  "sidecar": true,
  "args": true
}
```

### **4. Frontend Code Check**

**src/App.tsx should have:**
```typescript
const command = Command.sidecar('binaries/breeding-path.exe', args);
```

## 🛠️ Rebuilding Binaries

To rebuild all Python binaries:

```bash
npm run build-all-python
```

This will:
- Build all 4 Python scripts into binaries
- Create proper Tauri naming conventions
- Copy external CSV file (not embedded)
- Clean up build artifacts

## 📊 CSV File Management

### **Key Feature: Runtime Editable**
The CSV file is **intentionally NOT embedded** in the binary so you can:
- Edit breeding combinations without rebuilding
- Update the data by running scrapers
- Manually modify breeding rules

### **Updating Breeding Data**
```bash
# Update breeding combinations
cd src-tauri/binaries
./breeding-scraper.exe

# Update images 
./image-scraper.exe

# Full update (data + images)
./fullcalc-scraper.exe
```

## 🎯 Expected Behavior

When working correctly:
1. Tauri finds `breeding-path.exe-x86_64-pc-windows-msvc.exe`
2. Binary loads `palworld_breeding_combinations.csv` from same directory
3. Breeding calculations return multiple path options
4. UI displays results without errors

## 🐛 Common Issues

### **"Binary not found"**
- Restart Tauri dev server
- Check binary naming matches configuration
- Verify binary has execution permissions

### **"CSV file not found"** 
- Ensure `palworld_breeding_combinations.csv` exists in binaries directory
- Run scraper to generate fresh data
- Check binary can read from its directory

### **"No breeding paths found"**
- Verify CSV has data (should be ~23K lines)
- Check Pal names are spelled correctly
- Ensure CSV format: `child,parent1,parent2`

## 📋 File Structure
```
src-tauri/binaries/
├── breeding-path.exe                           # Generic binary
├── breeding-path.exe-x86_64-pc-windows-msvc.exe # Tauri expected name
├── fullcalc-scraper.exe                        # Data scraper
├── image-scraper.exe                           # Image scraper  
├── breeding-scraper.exe                        # Breeding scraper
└── palworld_breeding_combinations.csv          # External data (editable)
```

## 🚨 Emergency Reset

If nothing works:
1. Delete `src-tauri/binaries/` directory
2. Run `npm run build-all-python`
3. Restart Tauri: `npm run tauri dev`

This rebuilds everything from scratch. 