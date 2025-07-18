#!/usr/bin/env python3
"""
Debug script to analyze Tauri sidecar binary configuration
"""

import os
import json
import subprocess
from pathlib import Path

def main():
    print("🔍 TAURI SIDECAR BINARY CONFIGURATION ANALYSIS")
    print("=" * 60)
    
    script_dir = Path(__file__).parent
    binaries_dir = script_dir / "binaries"
    
    # 1. Check current directory
    print(f"\n📁 Current Directory: {script_dir.absolute()}")
    
    # 2. Check binaries directory
    print(f"\n📦 Binaries Directory: {binaries_dir.absolute()}")
    print(f"   Exists: {'✅' if binaries_dir.exists() else '❌'}")
    
    if binaries_dir.exists():
        print("\n🗂️  Files in binaries directory:")
        for file in sorted(binaries_dir.iterdir()):
            if file.is_file():
                size_mb = file.stat().st_size / (1024 * 1024)
                print(f"   {file.name} ({size_mb:.1f} MB)")
    
    # 3. Check tauri.conf.json
    tauri_conf = script_dir / "tauri.conf.json"
    print(f"\n⚙️  Tauri Configuration: {tauri_conf.absolute()}")
    print(f"   Exists: {'✅' if tauri_conf.exists() else '❌'}")
    
    if tauri_conf.exists():
        try:
            with open(tauri_conf) as f:
                config = json.load(f)
            
            external_bins = config.get("bundle", {}).get("externalBin", [])
            print(f"   External binaries configured: {external_bins}")
            
            # Check if the configured binaries actually exist
            for bin_path in external_bins:
                full_path = script_dir / bin_path
                print(f"   {bin_path}: {'✅ EXISTS' if full_path.exists() else '❌ NOT FOUND'}")
                
        except Exception as e:
            print(f"   Error reading config: {e}")
    
    # 4. Check capabilities
    capabilities_dir = script_dir / "capabilities"
    default_cap = capabilities_dir / "default.json"
    print(f"\n🔐 Capabilities Configuration: {default_cap.absolute()}")
    print(f"   Exists: {'✅' if default_cap.exists() else '❌'}")
    
    if default_cap.exists():
        try:
            with open(default_cap) as f:
                caps = json.load(f)
            
            permissions = caps.get("permissions", [])
            shell_perms = [p for p in permissions if isinstance(p, dict) and p.get("identifier") == "shell:allow-execute"]
            
            if shell_perms:
                allow_list = shell_perms[0].get("allow", [])
                print(f"   Shell execute permissions: {len(allow_list)} entries")
                for entry in allow_list:
                    if isinstance(entry, dict):
                        name = entry.get("name", "unknown")
                        sidecar = entry.get("sidecar", False)
                        print(f"     {name} (sidecar: {sidecar})")
            else:
                print("   No shell:allow-execute permissions found")
                
        except Exception as e:
            print(f"   Error reading capabilities: {e}")
    
    # 5. Get Rust target triple
    try:
        print(f"\n🦀 Rust Target Information:")
        result = subprocess.run(['rustc', '-vV'], capture_output=True, text=True)
        if result.returncode == 0:
            for line in result.stdout.split('\\n'):
                if 'host:' in line:
                    target = line.split('host:')[1].strip()
                    print(f"   Target triple: {target}")
                    
                    # Check if platform-specific binary exists
                    expected_names = [
                        f"binaries/breeding-path.exe-{target}.exe",
                        f"binaries/breeding-path-{target}.exe",
                        f"binaries/breeding-path.exe-{target}",
                    ]
                    
                    print(f"   Expected platform binary names:")
                    for name in expected_names:
                        full_path = script_dir / name
                        print(f"     {name}: {'✅ EXISTS' if full_path.exists() else '❌ NOT FOUND'}")
        else:
            print("   Could not get Rust target info")
    except Exception as e:
        print(f"   Error getting Rust info: {e}")
    
    # 6. Test binary execution
    print(f"\n🧪 Binary Execution Test:")
    test_binary = binaries_dir / "breeding-path.exe"
    if test_binary.exists():
        try:
            result = subprocess.run([str(test_binary), '--help'], 
                                  capture_output=True, text=True, timeout=5)
            print(f"   breeding-path.exe --help: {'✅ SUCCESS' if result.returncode == 0 else '❌ FAILED'}")
            if result.returncode != 0 and result.stderr:
                print(f"   Error: {result.stderr[:200]}...")
        except Exception as e:
            print(f"   Could not test binary: {e}")
    else:
        print(f"   breeding-path.exe not found for testing")
    
    print(f"\n🎯 RECOMMENDATIONS:")
    
    # Check common issues
    issues_found = []
    
    # Issue 1: Binary naming
    expected_tauri_binary = script_dir / "binaries/breeding-path.exe-x86_64-pc-windows-msvc.exe"
    if not expected_tauri_binary.exists():
        issues_found.append("❌ Missing Tauri expected binary: breeding-path.exe-x86_64-pc-windows-msvc.exe")
    
    # Issue 2: Configuration mismatch
    if tauri_conf.exists():
        with open(tauri_conf) as f:
            config = json.load(f)
        external_bins = config.get("bundle", {}).get("externalBin", [])
        if "binaries/breeding-path.exe" not in external_bins:
            issues_found.append("❌ Binary not listed in tauri.conf.json externalBin")
    
    if issues_found:
        for issue in issues_found:
            print(f"   {issue}")
        print(f"\\n   💡 Try running: npm run build-all-python")
    else:
        print(f"   ✅ Configuration appears correct")
        print(f"   💡 Try restarting Tauri dev server: npm run tauri dev")

if __name__ == "__main__":
    main() 