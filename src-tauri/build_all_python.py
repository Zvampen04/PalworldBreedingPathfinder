#!/usr/bin/env python3
"""
Comprehensive Python Binary Builder for Tauri Sidecar

This script builds all Python files into standalone binaries with proper Tauri naming conventions.
It handles multiple Python files and creates the correct target-specific binaries.
"""

import os
import sys
import subprocess
import shutil
import platform
from pathlib import Path

class PythonBinaryBuilder:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.binaries_dir = self.script_dir / "binaries"
        self.dist_dir = self.script_dir / "dist"
        self.build_dir = self.script_dir / "build"
        
        # Determine platform-specific settings
        self.is_windows = platform.system() == "Windows"
        self.extension = ".exe" if self.is_windows else ""
        
        # Get target triple
        self.target_triple = self.get_target_triple()
        
        # Define Python files to build
        self.python_files = [
            {
                "source": "shortest_breeding_path.py",
                "binary_name": "breeding-path",
                "description": "Main breeding path calculator",
                "primary": True  # This is the main binary used by Tauri
            },
            {
                "source": "palworld_fullCalc_scraper.py", 
                "binary_name": "fullcalc-scraper",
                "description": "Complete breeding data and image scraper",
                "primary": False
            },
            {
                "source": "palworld_image_scraper.py",
                "binary_name": "image-scraper", 
                "description": "Pal image scraper",
                "primary": False
            },
            {
                "source": "palworld_breeding_scraper.py",
                "binary_name": "breeding-scraper",
                "description": "Breeding combinations scraper",
                "primary": False
            }
            # Note: PalworldBreedingCalc.py is empty, so skipping it
        ]
        
        # Ensure directories exist
        self.binaries_dir.mkdir(exist_ok=True)
        
    def get_target_triple(self):
        """Get the Rust target triple for this platform"""
        try:
            result = subprocess.run(['rustc', '-vV'], 
                                  capture_output=True, text=True, check=True)
            for line in result.stdout.split('\n'):
                if line.startswith('host: '):
                    return line.split('host: ')[1].strip()
        except Exception as e:
            print(f"⚠️  Could not determine target triple: {e}")
            # Fallback based on platform
            if self.is_windows:
                return "x86_64-pc-windows-msvc"
            elif platform.system() == "Darwin":
                return "x86_64-apple-darwin"
            else:
                return "x86_64-unknown-linux-gnu"
        
        return "unknown"
    
    def check_dependencies(self):
        """Check if required dependencies are available"""
        print("🔍 Checking dependencies...")
        
        # Check Python
        try:
            result = subprocess.run([sys.executable, '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ Python: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ Python not found: {e}")
            return False
        
        # Check PyInstaller
        try:
            result = subprocess.run([sys.executable, '-m', 'PyInstaller', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ PyInstaller: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ PyInstaller not found. Installing...")
            try:
                subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'], 
                              check=True)
                print("✅ PyInstaller installed successfully")
            except Exception as install_error:
                print(f"❌ Failed to install PyInstaller: {install_error}")
                return False
        
        # Check Rust (for target triple)
        try:
            result = subprocess.run(['rustc', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ Rust: {result.stdout.strip()}")
        except Exception as e:
            print(f"⚠️  Rust not found, using fallback target triple")
        
        return True
    
    def build_binary(self, python_file_info):
        """Build a single Python file into a binary"""
        source_file = python_file_info["source"]
        binary_name = python_file_info["binary_name"]
        description = python_file_info["description"]
        is_primary = python_file_info["primary"]
        
        print(f"\n🔨 Building {description}")
        print(f"   Source: {source_file}")
        print(f"   Binary: {binary_name}")
        
        source_path = self.script_dir / source_file
        if not source_path.exists():
            print(f"❌ Source file not found: {source_path}")
            return False
        
        # Check if source file is empty
        if source_path.stat().st_size == 0:
            print(f"⚠️  Source file is empty, skipping: {source_file}")
            return False
        
        try:
            # Build with PyInstaller
            cmd = [
                sys.executable, '-m', 'PyInstaller',
                '--onefile',  # Create single executable
                '--console',  # Console application
                '--name', f"{binary_name}-{self.target_triple}",  # Platform-specific name
                '--distpath', str(self.dist_dir),
                '--workpath', str(self.build_dir),
                '--specpath', str(self.script_dir),
                '--noconfirm',  # Overwrite without asking
                str(source_path)
            ]
            
            # Note: CSV file is intentionally NOT included in the binary
            # It will be copied separately to allow runtime updates
            
            print(f"   Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Copy to binaries directory with multiple naming conventions
            platform_binary_name = f"{binary_name}-{self.target_triple}{self.extension}"
            generic_binary_name = f"{binary_name}{self.extension}"
            
            source_binary = self.dist_dir / platform_binary_name
            
            if source_binary.exists():
                # Copy platform-specific version
                platform_dest = self.binaries_dir / platform_binary_name
                shutil.copy2(source_binary, platform_dest)
                print(f"✅ Created: {platform_dest.name}")
                
                # Copy generic version
                generic_dest = self.binaries_dir / generic_binary_name  
                shutil.copy2(source_binary, generic_dest)
                print(f"✅ Created: {generic_dest.name}")
                
                # For the primary binary, create Tauri-expected naming
                if is_primary:
                    tauri_binary_name = f"{binary_name}{self.extension}-{self.target_triple}{self.extension}"
                    tauri_dest = self.binaries_dir / tauri_binary_name
                    shutil.copy2(source_binary, tauri_dest)
                    print(f"✅ Created Tauri binary: {tauri_dest.name}")
                
                # Check binary creation (no execution testing)
                self.test_binary(generic_dest, binary_name)
                
                return True
            else:
                print(f"❌ Built binary not found: {source_binary}")
                return False
                
        except subprocess.CalledProcessError as e:
            print(f"❌ Build failed for {source_file}")
            print(f"   Error: {e}")
            if e.stdout:
                print(f"   STDOUT: {e.stdout}")
            if e.stderr:
                print(f"   STDERR: {e.stderr}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error building {source_file}: {e}")
            return False
    
    def test_binary(self, binary_path, binary_name):
        """Check if binary file exists (execution testing disabled)"""
        if binary_path.exists():
            size_mb = binary_path.stat().st_size / (1024 * 1024)
            print(f"✅ Binary created: {binary_path.name} ({size_mb:.1f} MB)")
        else:
            print(f"❌ Binary file not found: {binary_path.name}")
    
    def copy_external_data_files(self):
        """Copy external data files that should not be embedded in binaries"""
        print("\n📄 Copying external data files...")
        
        # Copy CSV file to binaries directory
        csv_file = self.script_dir / "palworld_breeding_combinations.csv"
        if csv_file.exists():
            dest_csv = self.binaries_dir / "palworld_breeding_combinations.csv"
            shutil.copy2(csv_file, dest_csv)
            print(f"✅ Copied CSV file: {dest_csv.name}")
            print(f"   💡 This file can be edited to update breeding combinations")
        else:
            print(f"⚠️  CSV file not found: {csv_file}")
            print(f"   💡 Run the scraper scripts to generate it")
    
    def cleanup(self):
        """Clean up build artifacts"""
        print("\n🧹 Cleaning up build artifacts...")
        try:
            if self.build_dir.exists():
                shutil.rmtree(self.build_dir)
                print("✅ Cleaned build directory")
        except Exception as e:
            print(f"⚠️  Could not clean build directory: {e}")
        
        # Remove .spec files
        for spec_file in self.script_dir.glob("*.spec"):
            try:
                spec_file.unlink()
                print(f"✅ Removed {spec_file.name}")
            except Exception as e:
                print(f"⚠️  Could not remove {spec_file.name}: {e}")
    
    def build_all(self):
        """Build all Python files"""
        print("🚀 Starting comprehensive Python binary build")
        print(f"📋 Target platform: {self.target_triple}")
        print(f"📁 Output directory: {self.binaries_dir}")
        print("=" * 60)
        
        if not self.check_dependencies():
            print("❌ Dependency check failed")
            return False
        
        success_count = 0
        total_count = 0
        
        for python_file_info in self.python_files:
            total_count += 1
            if self.build_binary(python_file_info):
                success_count += 1
        
        print("\n" + "=" * 60)
        print("🏁 Build Summary")
        print("=" * 60)
        print(f"✅ Successfully built: {success_count}/{total_count} binaries")
        print(f"📁 Binaries location: {self.binaries_dir.absolute()}")
        
        # List all created binaries
        print("\n📦 Created binaries:")
        for binary_file in sorted(self.binaries_dir.glob("*")):
            if binary_file.is_file():
                size_mb = binary_file.stat().st_size / (1024 * 1024)
                print(f"   {binary_file.name} ({size_mb:.1f} MB)")
        
        # Copy external data files 
        self.copy_external_data_files()
        
        # Clean up
        self.cleanup()
        
        if success_count == total_count:
            print("\n🎉 All binaries built successfully!")
            print("\n💡 Next steps:")
            print("   1. Run 'npm run tauri dev' to start the application")
            print("   2. Use the breeding calculator in the UI")
            print("   3. Binaries will only execute when called by the Tauri app")
            return True
        else:
            print(f"\n⚠️  {total_count - success_count} binaries failed to build")
            return False


def main():
    """Main entry point"""
    try:
        builder = PythonBinaryBuilder()
        success = builder.build_all()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ Build interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 