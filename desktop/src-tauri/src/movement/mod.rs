pub mod controller;
pub mod coordinates;
pub mod monitor;

use tauri::{AppHandle, Manager};

pub use controller::*;
pub use coordinates::*;
pub use monitor::*;

#[tauri::command]
pub fn start_native_walk(
    app: AppHandle,
    direction: Option<f64>,
    speed: Option<f64>,
    boundary: Option<String>,
) -> Result<(), String> {
    let dir = direction.unwrap_or(1.0);
    let speed_px = speed.unwrap_or(80.0);
    let bound = boundary.unwrap_or_else(|| "current_monitor".into());
    controller::spawn_continuous_walk(app, dir, 0.0, speed_px, bound, "walk");
    Ok(())
}

#[tauri::command]
pub fn start_native_run(
    app: AppHandle,
    direction: Option<f64>,
    speed: Option<f64>,
    boundary: Option<String>,
) -> Result<(), String> {
    let dir = direction.unwrap_or(1.0);
    let speed_px = speed.unwrap_or(240.0);
    let bound = boundary.unwrap_or_else(|| "current_monitor".into());
    controller::spawn_continuous_walk(app, dir, 0.0, speed_px, bound, "run");
    Ok(())
}

#[tauri::command]
pub fn start_native_vertical_walk(
    app: AppHandle,
    direction: Option<f64>,
    speed: Option<f64>,
    boundary: Option<String>,
) -> Result<(), String> {
    let dir_y = direction.unwrap_or(1.0);
    let speed_px = speed.unwrap_or(80.0);
    let bound = boundary.unwrap_or_else(|| "current_monitor".into());
    controller::spawn_continuous_walk(app, 0.0, dir_y, speed_px, bound, "walk_vertical");
    Ok(())
}

#[tauri::command]
pub fn start_native_diagonal_walk(
    app: AppHandle,
    dir_x: Option<f64>,
    dir_y: Option<f64>,
    speed: Option<f64>,
    boundary: Option<String>,
) -> Result<(), String> {
    let dx = dir_x.unwrap_or(1.0);
    let dy = dir_y.unwrap_or(1.0);
    let speed_px = speed.unwrap_or(100.0);
    let bound = boundary.unwrap_or_else(|| "current_monitor".into());
    controller::spawn_continuous_walk(app, dx, dy, speed_px, bound, "walk_diagonal");
    Ok(())
}

#[tauri::command]
pub fn start_native_wander(
    app: AppHandle,
    speed: Option<f64>,
    boundary: Option<String>,
) -> Result<(), String> {
    let speed_px = speed.unwrap_or(75.0);
    let bound = boundary.unwrap_or_else(|| "current_monitor".into());
    controller::spawn_wander(app, speed_px, bound);
    Ok(())
}

#[tauri::command]
pub fn start_native_follow_cursor(
    app: AppHandle,
    standoff: Option<f64>,
    speed: Option<f64>,
) -> Result<(), String> {
    let standoff_px = standoff.unwrap_or(140.0);
    let speed_px = speed.unwrap_or(160.0);
    controller::spawn_follow_cursor(app, standoff_px, speed_px);
    Ok(())
}

#[tauri::command]
pub fn start_native_jump(
    app: AppHandle,
    height: Option<f64>,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let peak_h = height.unwrap_or(90.0);
    let dur = duration_ms.unwrap_or(650);
    controller::spawn_jump(app, peak_h, dur);
    Ok(())
}

#[tauri::command]
pub fn start_native_circle(
    app: AppHandle,
    radius: Option<f64>,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let r = radius.unwrap_or(80.0);
    let dur = duration_ms.unwrap_or(2400);
    controller::spawn_circle_motion(app, r, dur);
    Ok(())
}

#[tauri::command]
pub fn move_robot_to(
    app: AppHandle,
    x: f64,
    y: f64,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let dur = duration_ms.unwrap_or(700);
    controller::spawn_move_to_point(app, x, y, dur, "move_to");
    Ok(())
}

#[tauri::command]
pub fn move_robot_relative(
    app: AppHandle,
    dx: f64,
    dy: f64,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let dur = duration_ms.unwrap_or(500);
    if let Some(window) = app.get_webview_window("main") {
        let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
        if let Ok(pos) = window.outer_position() {
            let curr_x = pos.x as f64 / scale;
            let curr_y = pos.y as f64 / scale;
            controller::spawn_move_to_point(app, curr_x + dx, curr_y + dy, dur, "move_relative");
        }
    }
    Ok(())
}

#[tauri::command]
pub fn move_robot_to_edge(
    app: AppHandle,
    edge: String,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let dur = duration_ms.unwrap_or(800);
    if let Some(window) = app.get_webview_window("main") {
        let mon = monitor::get_current_monitor_bounds(&window);
        let padding = 24.0;
        let taskbar = 48.0;

        let (win_w, win_h) = if let Ok(sz) = window.outer_size() {
            (sz.width as f64 / mon.scale_factor, sz.height as f64 / mon.scale_factor)
        } else {
            (220.0, 320.0)
        };

        let min_x = mon.x + padding;
        let max_x = mon.x + mon.width - win_w - padding;
        let center_x = mon.x + (mon.width - win_w) / 2.0;

        let min_y = mon.y + padding;
        let max_y = mon.y + mon.height - win_h - taskbar - padding;
        let center_y = mon.y + (mon.height - win_h) / 2.0;

        let (target_x, target_y) = match edge.as_str() {
            "left" => (min_x, center_y),
            "right" => (max_x, center_y),
            "top" => (center_x, min_y),
            "bottom" => (center_x, max_y),
            "top_left" => (min_x, min_y),
            "top_right" => (max_x, min_y),
            "bottom_left" => (min_x, max_y),
            "bottom_right" => (max_x, max_y),
            "center" | _ => (center_x, center_y),
        };

        controller::spawn_move_to_point(app, target_x, target_y, dur, "move_edge");
    }
    Ok(())
}

#[tauri::command]
pub fn move_robot_home(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let mon = monitor::get_current_monitor_bounds(&window);
        let padding = 24.0;
        let taskbar = 48.0;

        // Default home is bottom-left corner
        let (_win_w, win_h) = if let Ok(sz) = window.outer_size() {
            (sz.width as f64 / mon.scale_factor, sz.height as f64 / mon.scale_factor)
        } else {
            (220.0, 320.0)
        };
        let target_x = mon.x + padding;
        let target_y = mon.y + mon.height - win_h - taskbar - padding;

        controller::spawn_move_to_point(app, target_x, target_y, 750, "return_home");
    }
    Ok(())
}

#[tauri::command]
pub fn stop_native_movement(app: AppHandle) -> Result<(), String> {
    controller::stop_all_movement(&app);
    Ok(())
}

#[tauri::command]
pub fn get_virtual_desktop_bounds(app: AppHandle) -> Result<VirtualDesktopBounds, String> {
    if let Some(window) = app.get_webview_window("main") {
        let monitors = monitor::get_monitors_for_window(&window);
        return Ok(monitor::calculate_virtual_desktop_bounds(&monitors));
    }
    Ok(VirtualDesktopBounds::default())
}

#[tauri::command]
pub fn get_available_monitors(app: AppHandle) -> Result<Vec<MonitorInfo>, String> {
    if let Some(window) = app.get_webview_window("main") {
        return Ok(monitor::get_monitors_for_window(&window));
    }
    Ok(Vec::new())
}
