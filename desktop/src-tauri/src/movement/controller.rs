use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::sleep;

use super::coordinates::{ease_in_out_quad, parabolic_arc, FastRng};
use super::monitor::{
    calculate_virtual_desktop_bounds, get_current_monitor_bounds, get_monitors_for_window,
};

static ACTIVE_OPERATION_ID: AtomicU64 = AtomicU64::new(0);
static IS_MOVING: AtomicBool = AtomicBool::new(false);

pub fn get_next_op_id() -> u64 {
    IS_MOVING.store(true, Ordering::SeqCst);
    ACTIVE_OPERATION_ID.fetch_add(1, Ordering::SeqCst) + 1
}

pub fn is_op_active(op_id: u64) -> bool {
    IS_MOVING.load(Ordering::SeqCst) && ACTIVE_OPERATION_ID.load(Ordering::SeqCst) == op_id
}

pub fn stop_all_movement(app: &AppHandle) {
    IS_MOVING.store(false, Ordering::SeqCst);
    ACTIVE_OPERATION_ID.fetch_add(1, Ordering::SeqCst);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("vcamp:movement-stopped", ());
    }
}

pub fn is_currently_moving() -> bool {
    IS_MOVING.load(Ordering::SeqCst)
}

fn get_active_bounds(window: &tauri::WebviewWindow, boundary_mode: &str) -> (f64, f64, f64, f64) {
    let padding = 16.0;
    let taskbar_padding = 48.0;

    let (win_w, win_h) = if let Ok(sz) = window.outer_size() {
        let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
        (sz.width as f64 / scale, sz.height as f64 / scale)
    } else {
        (220.0, 320.0)
    };

    if boundary_mode == "entire_desktop" {
        let monitors = get_monitors_for_window(window);
        let bounds = calculate_virtual_desktop_bounds(&monitors);
        (
            bounds.min_x + padding,
            bounds.min_y + padding,
            bounds.max_x - win_w - padding,
            bounds.max_y - win_h - taskbar_padding,
        )
    } else {
        let mon = get_current_monitor_bounds(window);
        (
            mon.x + padding,
            mon.y + padding,
            mon.x + mon.width - win_w - padding,
            mon.y + mon.height - win_h - taskbar_padding,
        )
    }
}

pub fn spawn_continuous_walk(
    app: AppHandle,
    dir_x: f64,
    dir_y: f64,
    speed_px: f64,
    boundary_mode: String,
    mode_label: &'static str,
) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let frame_duration = Duration::from_millis(16); // 60 FPS
        let dt = 0.016;

        let mut current_dir_x = if dir_x != 0.0 { dir_x.signum() } else { 1.0 };
        let mut current_dir_y = dir_y.signum();

        // Emit initial direction
        let _ = window.emit("vcamp:movement-direction", current_dir_x);

        while is_op_active(op_id) {
            let (min_x, min_y, max_x, max_y) = get_active_bounds(&window, &boundary_mode);

            if let Ok(pos) = window.outer_position() {
                let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
                let curr_x = pos.x as f64 / scale;
                let curr_y = pos.y as f64 / scale;

                let mut next_x = curr_x + current_dir_x * speed_px * dt;
                let mut next_y = if dir_y != 0.0 { curr_y + current_dir_y * speed_px * 0.75 * dt } else { curr_y };

                // Horizontal bounce
                if next_x >= max_x {
                    next_x = max_x;
                    current_dir_x = -1.0;
                    let _ = window.emit("vcamp:movement-direction", -1.0);
                } else if next_x <= min_x {
                    next_x = min_x;
                    current_dir_x = 1.0;
                    let _ = window.emit("vcamp:movement-direction", 1.0);
                }

                // Vertical bounce if vertical movement requested
                if dir_y != 0.0 {
                    if next_y >= max_y {
                        next_y = max_y;
                        current_dir_y = -1.0;
                    } else if next_y <= min_y {
                        next_y = min_y;
                        current_dir_y = 1.0;
                    }
                }

                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                    x: next_x,
                    y: next_y,
                }));

                let _ = window.emit("vcamp:movement-step", serde_json::json!({
                    "mode": mode_label,
                    "x": next_x,
                    "y": next_y,
                    "direction": current_dir_x,
                }));
            }

            sleep(frame_duration).await;
        }
    });
}

pub fn spawn_move_to_point(
    app: AppHandle,
    target_x: f64,
    target_y: f64,
    duration_ms: u64,
    mode_label: &'static str,
) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);

        let (start_x, start_y) = if let Ok(pos) = window.outer_position() {
            (pos.x as f64 / scale, pos.y as f64 / scale)
        } else {
            (target_x, target_y)
        };

        let dir_x = if target_x >= start_x { 1.0 } else { -1.0 };
        let _ = window.emit("vcamp:movement-direction", dir_x);

        let total_frames = ((duration_ms as f64 / 16.0).max(1.0)) as usize;
        let frame_duration = Duration::from_millis(16);

        for frame in 0..=total_frames {
            if !is_op_active(op_id) {
                return;
            }

            let progress = frame as f64 / total_frames as f64;
            let eased = ease_in_out_quad(progress);

            let curr_x = start_x + (target_x - start_x) * eased;
            let curr_y = start_y + (target_y - start_y) * eased;

            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x: curr_x,
                y: curr_y,
            }));

            let _ = window.emit("vcamp:movement-step", serde_json::json!({
                "mode": mode_label,
                "x": curr_x,
                "y": curr_y,
                "direction": dir_x,
                "progress": progress,
            }));

            if frame < total_frames {
                sleep(frame_duration).await;
            }
        }

        // Completed movement
        if is_op_active(op_id) {
            IS_MOVING.store(false, Ordering::SeqCst);
            let _ = window.emit("vcamp:movement-stopped", ());
        }
    });
}

pub fn spawn_jump(app: AppHandle, peak_height: f64, duration_ms: u64) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);

        let (base_x, base_y) = if let Ok(pos) = window.outer_position() {
            (pos.x as f64 / scale, pos.y as f64 / scale)
        } else {
            (24.0, 700.0)
        };

        let total_frames = ((duration_ms as f64 / 16.0).max(1.0)) as usize;
        let frame_duration = Duration::from_millis(16);

        for frame in 0..=total_frames {
            if !is_op_active(op_id) {
                return;
            }

            let progress = frame as f64 / total_frames as f64;
            let offset_y = parabolic_arc(progress, peak_height);
            let current_y = base_y + offset_y;

            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x: base_x,
                y: current_y,
            }));

            let _ = window.emit("vcamp:movement-step", serde_json::json!({
                "mode": "jump",
                "x": base_x,
                "y": current_y,
                "offset_y": offset_y,
                "progress": progress,
                "is_jumping": true,
            }));

            if frame < total_frames {
                sleep(frame_duration).await;
            }
        }

        // Return exactly to base position
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x: base_x,
            y: base_y,
        }));

        if is_op_active(op_id) {
            IS_MOVING.store(false, Ordering::SeqCst);
            let _ = window.emit("vcamp:movement-step", serde_json::json!({
                "mode": "jump",
                "x": base_x,
                "y": base_y,
                "offset_y": 0.0,
                "progress": 1.0,
                "is_jumping": false,
            }));
            let _ = window.emit("vcamp:movement-stopped", ());
        }
    });
}

pub fn spawn_wander(app: AppHandle, speed_px: f64, boundary_mode: String) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let mut rng = FastRng::from_time();

        while is_op_active(op_id) {
            let (min_x, min_y, max_x, max_y) = get_active_bounds(&window, &boundary_mode);

            // Pick random target in bounds
            let target_x = rng.range_f64(min_x, max_x);
            let target_y = rng.range_f64(min_y, max_y);

            let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
            let (start_x, start_y) = if let Ok(pos) = window.outer_position() {
                (pos.x as f64 / scale, pos.y as f64 / scale)
            } else {
                (target_x, target_y)
            };

            let dist = ((target_x - start_x).powi(2) + (target_y - start_y).powi(2)).sqrt();
            let duration_sec = (dist / speed_px).max(0.5);
            let total_frames = (duration_sec * 60.0) as usize;

            let dir_x = if target_x >= start_x { 1.0 } else { -1.0 };
            let _ = window.emit("vcamp:movement-direction", dir_x);

            // Walk to target
            for frame in 0..=total_frames {
                if !is_op_active(op_id) {
                    return;
                }

                let progress = frame as f64 / total_frames.max(1) as f64;
                let eased = ease_in_out_quad(progress);

                let curr_x = start_x + (target_x - start_x) * eased;
                let curr_y = start_y + (target_y - start_y) * eased;

                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                    x: curr_x,
                    y: curr_y,
                }));

                let _ = window.emit("vcamp:movement-step", serde_json::json!({
                    "mode": "wander",
                    "x": curr_x,
                    "y": curr_y,
                    "direction": dir_x,
                    "progress": progress,
                }));

                sleep(Duration::from_millis(16)).await;
            }

            // Pause at destination for 1.5 - 3.0 seconds (looking around / resting)
            let pause_ms = rng.range_f64(1500.0, 3000.0) as u64;
            let pause_slice = 100;
            let pause_steps = pause_ms / pause_slice;

            for _ in 0..pause_steps {
                if !is_op_active(op_id) {
                    return;
                }
                sleep(Duration::from_millis(pause_slice)).await;
            }
        }
    });
}

pub fn spawn_follow_cursor(app: AppHandle, standoff_px: f64, speed_px: f64) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let dt = 0.016;

        while is_op_active(op_id) {
            let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);

            if let (Ok(win_pos), Ok(cursor_pos)) = (window.outer_position(), window.cursor_position()) {
                let curr_x = win_pos.x as f64 / scale;
                let curr_y = win_pos.y as f64 / scale;

                // cursor_position in Tauri is relative to window or screen
                // With multiple monitors or global cursor, we smoothly approach cursor
                let target_cursor_x = cursor_pos.x / scale;
                let target_cursor_y = cursor_pos.y / scale;

                let dx = target_cursor_x - curr_x;
                let dy = target_cursor_y - curr_y;
                let dist = (dx * dx + dy * dy).sqrt();

                if dist > standoff_px {
                    let dir_x = if dx >= 0.0 { 1.0 } else { -1.0 };
                    let _ = window.emit("vcamp:movement-direction", dir_x);

                    let move_dist = (speed_px * dt).min(dist - standoff_px);
                    let angle = dy.atan2(dx);

                    let next_x = curr_x + angle.cos() * move_dist;
                    let next_y = curr_y + angle.sin() * move_dist;

                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                        x: next_x,
                        y: next_y,
                    }));

                    let _ = window.emit("vcamp:movement-step", serde_json::json!({
                        "mode": "follow_cursor",
                        "x": next_x,
                        "y": next_y,
                        "direction": dir_x,
                    }));
                }
            }

            sleep(Duration::from_millis(16)).await;
        }
    });
}

pub fn spawn_circle_motion(app: AppHandle, radius: f64, duration_ms: u64) {
    let op_id = get_next_op_id();

    tauri::async_runtime::spawn(async move {
        let Some(window) = app.get_webview_window("main") else { return; };
        let scale = window.current_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);

        let (center_x, center_y) = if let Ok(pos) = window.outer_position() {
            (pos.x as f64 / scale, pos.y as f64 / scale)
        } else {
            (500.0, 500.0)
        };

        let total_frames = ((duration_ms as f64 / 16.0).max(1.0)) as usize;
        let frame_duration = Duration::from_millis(16);

        for frame in 0..=total_frames {
            if !is_op_active(op_id) {
                return;
            }

            let progress = frame as f64 / total_frames as f64;
            let angle = progress * 2.0 * std::f64::consts::PI;

            let curr_x = center_x + radius * (angle.sin());
            let curr_y = center_y + radius * (1.0 - angle.cos());
            let dir_x = if angle.cos() >= 0.0 { 1.0 } else { -1.0 };

            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x: curr_x,
                y: curr_y,
            }));

            let _ = window.emit("vcamp:movement-step", serde_json::json!({
                "mode": "circle",
                "x": curr_x,
                "y": curr_y,
                "direction": dir_x,
                "progress": progress,
            }));

            if frame < total_frames {
                sleep(frame_duration).await;
            }
        }

        // Return to start center
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x: center_x,
            y: center_y,
        }));

        if is_op_active(op_id) {
            IS_MOVING.store(false, Ordering::SeqCst);
            let _ = window.emit("vcamp:movement-stopped", ());
        }
    });
}
