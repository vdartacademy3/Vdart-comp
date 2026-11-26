pub mod movement;

use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_autostart::ManagerExt;

use movement::*;

fn resolve_vcamp_data_dir(app: &AppHandle) -> PathBuf {
    if let Ok(dir) = app.path().app_data_dir() {
        let store = dir.join("data");
        let _ = fs::create_dir_all(&store);
        return store;
    }
    let fallback = std::env::temp_dir().join("vcamp_data");
    let _ = fs::create_dir_all(&fallback);
    fallback
}

fn sanitize_storage_key(key: &str) -> String {
    key.chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '_' || c == '-' { c } else { '_' })
        .collect()
}

#[tauri::command]
fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    Ok(resolve_vcamp_data_dir(&app).to_string_lossy().to_string())
}

#[tauri::command]
fn save_app_data(app: AppHandle, key: String, payload: String) -> Result<(), String> {
    let dir = resolve_vcamp_data_dir(&app);
    let safe_key = sanitize_storage_key(&key);
    let path = dir.join(format!("{}.json", safe_key));
    fs::write(path, payload).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_app_data(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let dir = resolve_vcamp_data_dir(&app);
    let safe_key = sanitize_storage_key(&key);
    let path = dir.join(format!("{}.json", safe_key));
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_app_data(app: AppHandle, key: String) -> Result<(), String> {
    let dir = resolve_vcamp_data_dir(&app);
    let safe_key = sanitize_storage_key(&key);
    let path = dir.join(format!("{}.json", safe_key));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_autostart_enabled(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<bool, String> {
    if enabled {
        app.autolaunch().enable().map_err(|e| e.to_string())?;
    } else {
        app.autolaunch().disable().map_err(|e| e.to_string())?;
    }
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_companion(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
    Ok(())
}

#[tauri::command]
fn restore_and_focus_companion(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn open_dashboard(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        // Send event to open dashboard modal in UI
        let _ = window.eval("window.dispatchEvent(new CustomEvent('vcamp:open-dashboard'))");
    }
    Ok(())
}

#[tauri::command]
fn exit_vcamp(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn start_window_drag(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.start_dragging();
    }
    Ok(())
}

#[tauri::command]
fn update_window_layout(app: AppHandle, width: f64, height: f64, center: Option<bool>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let scale_factor = monitor.scale_factor();
            let monitor_size = monitor.size();
            let monitor_pos = monitor.position();

            let logical_screen_w = monitor_size.width as f64 / scale_factor;
            let logical_screen_h = monitor_size.height as f64 / scale_factor;
            let logical_screen_x = monitor_pos.x as f64 / scale_factor;
            let logical_screen_y = monitor_pos.y as f64 / scale_factor;

            let taskbar_height = 48.0;

            let (curr_x, curr_y) = if let Ok(pos) = window.outer_position() {
                (pos.x as f64 / scale_factor, pos.y as f64 / scale_factor)
            } else {
                (logical_screen_x + 24.0, logical_screen_y + logical_screen_h - height - taskbar_height - 24.0)
            };

            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));

            if center.unwrap_or(false) || (width > 700.0 && height > 550.0) {
                // Modal / Auth / Dashboard: center cleanly on screen
                let target_x = logical_screen_x + (logical_screen_w - width).max(0.0) / 2.0;
                let target_y = logical_screen_y + (logical_screen_h - height).max(0.0) / 2.0;
                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                    x: target_x.max(logical_screen_x),
                    y: target_y.max(logical_screen_y),
                }));
            } else {
                // Robot / Chat / Speech Bubble: preserve existing coordinates, clamp within monitor
                let max_x = (logical_screen_x + logical_screen_w - width - 10.0).max(logical_screen_x + 10.0);
                let max_y = (logical_screen_y + logical_screen_h - height - taskbar_height - 10.0).max(logical_screen_y + 10.0);
                let target_x = curr_x.clamp(logical_screen_x + 10.0, max_x);
                let target_y = curr_y.clamp(logical_screen_y + 10.0, max_y);
                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                    x: target_x,
                    y: target_y,
                }));
            }
        }
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct DesktopBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub scale_factor: f64,
}

#[tauri::command]
fn get_desktop_bounds(app: AppHandle) -> Result<DesktopBounds, String> {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let scale = monitor.scale_factor();
            let size = monitor.size();
            let pos = monitor.position();
            return Ok(DesktopBounds {
                x: pos.x as f64 / scale,
                y: pos.y as f64 / scale,
                width: size.width as f64 / scale,
                height: size.height as f64 / scale,
                scale_factor: scale,
            });
        }
    }
    Ok(DesktopBounds {
        x: 0.0,
        y: 0.0,
        width: 1920.0,
        height: 1080.0,
        scale_factor: 1.0,
    })
}

#[tauri::command]
fn get_window_position(app: AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(pos) = window.outer_position() {
            let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
            return Ok((pos.x as f64 / scale, pos.y as f64 / scale));
        }
    }
    Ok((24.0, 700.0))
}

#[tauri::command]
fn set_window_position(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
    }
    Ok(())
}

#[tauri::command]
fn get_cursor_position(app: AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(pos) = window.cursor_position() {
            let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
            return Ok((pos.x / scale, pos.y / scale));
        }
    }
    Ok((960.0, 540.0))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    eprintln!(">>> [VCAMP] Initializing Tauri Builder with Native Movement Engine...");
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            toggle_companion,
            restore_and_focus_companion,
            open_dashboard,
            exit_vcamp,
            start_window_drag,
            update_window_layout,
            get_desktop_bounds,
            get_window_position,
            set_window_position,
            get_cursor_position,
            get_app_data_dir,
            save_app_data,
            load_app_data,
            delete_app_data,
            get_autostart_enabled,
            set_autostart_enabled,
            // Native Movement Engine commands
            start_native_walk,
            start_native_run,
            start_native_vertical_walk,
            start_native_diagonal_walk,
            start_native_wander,
            start_native_follow_cursor,
            start_native_jump,
            start_native_circle,
            move_robot_to,
            move_robot_relative,
            move_robot_to_edge,
            move_robot_home,
            stop_native_movement,
            get_virtual_desktop_bounds,
            get_available_monitors
        ])
        .setup(|app| {
            eprintln!(">>> [VCAMP] Running setup closure...");
            // Position companion at bottom-left on launch with 24px margins
            if let Some(window) = app.get_webview_window("main") {
                eprintln!(">>> [VCAMP] WebviewWindow 'main' found!");
                if let Ok(Some(monitor)) = window.current_monitor() {
                    eprintln!(">>> [VCAMP] Monitor detected: {:?}", monitor.name());
                    let scale_factor = monitor.scale_factor();
                    let monitor_size = monitor.size();
                    let monitor_pos = monitor.position();

                    let logical_screen_h = monitor_size.height as f64 / scale_factor;
                    let logical_screen_x = monitor_pos.x as f64 / scale_factor;
                    let logical_screen_y = monitor_pos.y as f64 / scale_factor;

                    let base_h = 90.0 + logical_screen_h * (1.0 / 6.0);
                    let robot_h = base_h.clamp(170.0, 280.0);
                    let robot_w = (robot_h * 0.74).round();
                    let init_w = robot_w + 16.0;
                    let init_h = robot_h + 36.0 + 16.0;

                    let margin_left = 24.0;
                    let margin_bottom = 24.0;
                    let taskbar_height = 48.0;

                    let target_x = logical_screen_x + margin_left;
                    let target_y = logical_screen_y + logical_screen_h - init_h - taskbar_height - margin_bottom;

                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                        width: init_w,
                        height: init_h,
                    }));
                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                        x: target_x.max(logical_screen_x),
                        y: target_y.max(logical_screen_y),
                    }));
                }
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
            eprintln!(">>> [VCAMP] Window positioned and displayed successfully.");

            // Setup System Tray safely
            let show_i = MenuItem::with_id(app, "show", "Show Companion", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide Companion", true, None::<&str>)?;
            let dash_i = MenuItem::with_id(app, "dash", "Open Dashboard", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Exit VCamp", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_i, &hide_i, &dash_i, &quit_i])?;

            if let Some(icon) = app.default_window_icon().cloned() {
                let tray_res = TrayIconBuilder::new()
                    .icon(icon)
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .tooltip("VDart Companion (VCamp)")
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "dash" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.dispatchEvent(new CustomEvent('vcamp:open-dashboard'))");
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click { button, .. } = event {
                            if button == tauri::tray::MouseButton::Left {
                                let app = tray.app_handle();
                                if let Some(window) = app.get_webview_window("main") {
                                    if window.is_visible().unwrap_or(false) {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        }
                    })
                    .build(app);

                match tray_res {
                    Ok(_) => eprintln!(">>> [VCAMP] Tray icon initialized successfully!"),
                    Err(e) => eprintln!(">>> [VCAMP] Warning: Failed to build tray icon: {e:?}"),
                }
            } else {
                eprintln!(">>> [VCAMP] Notice: No default window icon found, continuing without tray.");
            }

            eprintln!(">>> [VCAMP] Setup completed successfully!");

            // Window event listeners: track movement & prevent close (hide to tray)
            if let Some(window) = app.get_webview_window("main") {
                let win_clone = window.clone();
                let win_event_clone = window.clone();
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Moved(pos) => {
                            if let Ok(Some(mon)) = win_event_clone.current_monitor() {
                                let scale = mon.scale_factor();
                                let x = pos.x as f64 / scale;
                                let y = pos.y as f64 / scale;
                                let _ = win_event_clone.emit("vcamp:window-moved", serde_json::json!({ "x": x, "y": y }));
                            }
                        }
                        tauri::WindowEvent::CloseRequested { api, .. } => {
                            api.prevent_close();
                            let _ = win_clone.hide();
                        }
                        _ => {}
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running VCamp desktop application");
}
