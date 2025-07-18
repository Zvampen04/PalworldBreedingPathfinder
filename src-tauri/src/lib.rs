// Include the generated Pal list from build.rs
include!(concat!(env!("OUT_DIR"), "/pal_list.rs"));

use tauri::Emitter;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_pal_list() -> Vec<String> {
    PAL_NAMES.iter().map(|s| s.to_string()).collect()
}

#[tauri::command]
fn read_breeding_csv() -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    
    let csv_path = Path::new("palworld_breeding_combinations.csv");
    if !csv_path.exists() {
        return Err("Breeding CSV file not found".to_string());
    }
    
    fs::read_to_string(csv_path)
        .map_err(|e| format!("Failed to read CSV file: {}", e))
}

#[tauri::command]
async fn run_sidecar_with_progress(
    app: tauri::AppHandle,
    script: String,
    label: String,
) -> Result<(), String> {
    use tauri_plugin_shell::{ShellExt, process::CommandEvent};
    
    // Strip the "binaries/" prefix if present
    let script_name = if script.starts_with("binaries/") {
        &script[9..] // Remove "binaries/" prefix
    } else {
        &script
    };
    
    let sidecar_command = app
        .shell()
        .sidecar(script_name)
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?;
    
    let (mut rx, _child) = sidecar_command
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;
    
    // Listen to events from the sidecar
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line_bytes) => {
                let line = String::from_utf8_lossy(&line_bytes);
                let output = line.trim();
                
                // Parse progress updates in format "PROGRESS: current/total"
                if let Some(captures) = output.strip_prefix("PROGRESS: ") {
                    if let Some((current_str, max_str)) = captures.split_once('/') {
                        if let (Ok(current), Ok(max)) = (current_str.parse::<i32>(), max_str.parse::<i32>()) {
                            // Emit progress event to frontend
                            app.emit("sidecar-progress", serde_json::json!({
                                "script": script,
                                "label": label,
                                "current": current,
                                "max": max
                            })).map_err(|e| format!("Failed to emit progress event: {}", e))?;
                        }
                    }
                }
                
                // Also emit raw output for debugging
                app.emit("sidecar-output", serde_json::json!({
                    "script": script,
                    "output": output
                })).map_err(|e| format!("Failed to emit output event: {}", e))?;
            }
            CommandEvent::Stderr(line_bytes) => {
                let line = String::from_utf8_lossy(&line_bytes);
                let error = line.trim();
                
                // Emit error output
                app.emit("sidecar-error", serde_json::json!({
                    "script": script,
                    "error": error
                })).map_err(|e| format!("Failed to emit error event: {}", e))?;
            }
            CommandEvent::Terminated(payload) => {
                if payload.code == Some(0) {
                    app.emit("sidecar-complete", serde_json::json!({
                        "script": script,
                        "success": true
                    })).map_err(|e| format!("Failed to emit complete event: {}", e))?;
                } else {
                    app.emit("sidecar-complete", serde_json::json!({
                        "script": script,
                        "success": false,
                        "exit_code": payload.code
                    })).map_err(|e| format!("Failed to emit complete event: {}", e))?;
                }
                break;
            }
            _ => {}
        }
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_pal_list, read_breeding_csv, run_sidecar_with_progress])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
