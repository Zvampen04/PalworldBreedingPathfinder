# File Locations and Path Management

This document explains how the Python scripts handle file paths when executed from the Tauri application.

## Directory Structure

```
palworld-calculator/
├── public/
│   ├── Assets/           # Pal images (accessible to frontend)
│   │   ├── Lamball.jpg
│   │   ├── Chikipi.jpg
│   │   └── ...
│   └── vite.svg
├── src/                  # Frontend React code
├── src-tauri/           # Backend Tauri/Rust code + Python scripts
│   ├── palworld_breeding_combinations.csv
│   ├── shortest_breeding_path.py
│   ├── palworld_breeding_scraper.py
│   ├── palworld_fullCalc_scraper.py
│   ├── palworld_image_scraper.py
│   ├── PalworldBreedingCalc.py
│   ├── README.md
│   ├── requirements.txt
│   └── ...
```

## Path Logic Updates

### Image Downloads
**Scripts:** `palworld_image_scraper.py`, `palworld_fullCalc_scraper.py`

**Old behavior:** Creates `assets/` folder relative to current working directory
**New behavior:** 
- Determines script location: `os.path.dirname(os.path.abspath(__file__))`
- Goes up one level to project root: `os.path.dirname(script_dir)`
- Creates path to: `project_root/public/Assets/`
- **Result:** Images saved to `public/Assets/` directory for frontend access

### CSV File Outputs
**Scripts:** `palworld_breeding_scraper.py`, `palworld_fullCalc_scraper.py`

**Old behavior:** Saves CSV files relative to current working directory
**New behavior:**
- If filename has no directory path, determines script location
- Saves to: `script_directory/filename`
- **Result:** CSV files saved to `src-tauri/` directory with other data

### CSV File Inputs
**Script:** `shortest_breeding_path.py`

**Behavior:**
- If CSV filename has no directory path, looks in script directory
- **Result:** Reads from `src-tauri/palworld_breeding_combinations.csv`

## Benefits

1. **Consistent paths:** Files are always written to correct locations regardless of where script is executed from
2. **Frontend access:** Images in `public/Assets/` are accessible via HTTP to the React frontend
3. **Data persistence:** CSV files stay with the application in `src-tauri/`
4. **Cross-platform:** Absolute path logic works on Windows, Mac, and Linux

## Testing

Both path strategies have been tested and confirmed working:
- Assets path: `D:\Instalations\PalworldBreeding-dev\palworld-calculator\public\Assets` ✅
- CSV path: `D:\Instalations\PalworldBreeding-dev\palworld-calculator\src-tauri\palworld_breeding_combinations.csv` ✅ 