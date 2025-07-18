use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Get the assets directory path
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let assets_path = Path::new(&manifest_dir).join("Assets");
    
    if assets_path.exists() {
        println!("cargo:rerun-if-changed={}", assets_path.display());
        
        // Read all .jpg files and extract Pal names
        let mut pal_names = Vec::new();
        
        if let Ok(entries) = fs::read_dir(&assets_path) {
            for entry in entries.flatten() {
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".jpg") {
                        // Remove .jpg extension and convert underscores to spaces
                        let pal_name = file_name.replace(".jpg", "").replace("_", " ");
                        pal_names.push(pal_name.clone());
                        
                        // Also add base name without variants
                        let base_name = pal_name.split(' ').next().unwrap_or("").to_string();
                        if !base_name.is_empty() && base_name != pal_name {
                            pal_names.push(base_name);
                        }
                    }
                }
            }
        }
        
        // Remove duplicates and sort
        pal_names.sort();
        pal_names.dedup();
        
        // Generate Rust code
        let out_dir = env::var("OUT_DIR").unwrap();
        let dest_path = Path::new(&out_dir).join("pal_list.rs");
        
        let rust_code = format!(
            "pub const PAL_NAMES: &[&str] = &{:#?};",
            pal_names
        );
        
        fs::write(&dest_path, rust_code).unwrap();
        
        println!("Generated Pal list with {} names", pal_names.len());
    } else {
        println!("Assets directory not found, creating empty Pal list");
        let out_dir = env::var("OUT_DIR").unwrap();
        let dest_path = Path::new(&out_dir).join("pal_list.rs");
        fs::write(&dest_path, "pub const PAL_NAMES: &[&str] = &[];").unwrap();
    }
    
    tauri_build::build()
}
