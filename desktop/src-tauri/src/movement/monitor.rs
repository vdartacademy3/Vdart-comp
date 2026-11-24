use serde::{Deserialize, Serialize};
use tauri::WebviewWindow;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MonitorInfo {
    pub name: Option<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub scale_factor: f64,
    pub is_primary: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VirtualDesktopBounds {
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
    pub total_width: f64,
    pub total_height: f64,
    pub monitor_count: usize,
}

impl Default for VirtualDesktopBounds {
    fn default() -> Self {
        Self {
            min_x: 0.0,
            min_y: 0.0,
            max_x: 1920.0,
            max_y: 1080.0,
            total_width: 1920.0,
            total_height: 1080.0,
            monitor_count: 1,
        }
    }
}

pub fn get_monitors_for_window(window: &WebviewWindow) -> Vec<MonitorInfo> {
    let mut result = Vec::new();

    if let Ok(monitors) = window.available_monitors() {
        for monitor in monitors {
            let scale = monitor.scale_factor();
            let pos = monitor.position();
            let size = monitor.size();

            let x = pos.x as f64 / scale;
            let y = pos.y as f64 / scale;
            let width = size.width as f64 / scale;
            let height = size.height as f64 / scale;

            // Check if primary monitor (position typically 0,0)
            let is_primary = pos.x == 0 && pos.y == 0;

            result.push(MonitorInfo {
                name: monitor.name().cloned(),
                x,
                y,
                width,
                height,
                scale_factor: scale,
                is_primary,
            });
        }
    }

    if result.is_empty() {
        if let Ok(Some(current)) = window.current_monitor() {
            let scale = current.scale_factor();
            let pos = current.position();
            let size = current.size();
            result.push(MonitorInfo {
                name: current.name().cloned(),
                x: pos.x as f64 / scale,
                y: pos.y as f64 / scale,
                width: size.width as f64 / scale,
                height: size.height as f64 / scale,
                scale_factor: scale,
                is_primary: true,
            });
        }
    }

    result
}

pub fn calculate_virtual_desktop_bounds(monitors: &[MonitorInfo]) -> VirtualDesktopBounds {
    if monitors.is_empty() {
        return VirtualDesktopBounds::default();
    }

    let mut min_x = f64::MAX;
    let mut min_y = f64::MAX;
    let mut max_x = f64::MIN;
    let mut max_y = f64::MIN;

    for m in monitors {
        if m.x < min_x {
            min_x = m.x;
        }
        if m.y < min_y {
            min_y = m.y;
        }
        let right = m.x + m.width;
        let bottom = m.y + m.height;
        if right > max_x {
            max_x = right;
        }
        if bottom > max_y {
            max_y = bottom;
        }
    }

    VirtualDesktopBounds {
        min_x,
        min_y,
        max_x,
        max_y,
        total_width: max_x - min_x,
        total_height: max_y - min_y,
        monitor_count: monitors.len(),
    }
}

pub fn get_current_monitor_bounds(window: &WebviewWindow) -> MonitorInfo {
    if let Ok(Some(current)) = window.current_monitor() {
        let scale = current.scale_factor();
        let pos = current.position();
        let size = current.size();
        MonitorInfo {
            name: current.name().cloned(),
            x: pos.x as f64 / scale,
            y: pos.y as f64 / scale,
            width: size.width as f64 / scale,
            height: size.height as f64 / scale,
            scale_factor: scale,
            is_primary: pos.x == 0 && pos.y == 0,
        }
    } else {
        MonitorInfo {
            name: Some("Default".into()),
            x: 0.0,
            y: 0.0,
            width: 1920.0,
            height: 1080.0,
            scale_factor: 1.0,
            is_primary: true,
        }
    }
}
