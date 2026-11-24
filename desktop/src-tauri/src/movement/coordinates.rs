use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq)]
pub struct LogicalPoint {
    pub x: f64,
    pub y: f64,
}

impl LogicalPoint {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn distance_to(&self, other: &LogicalPoint) -> f64 {
        let dx = other.x - self.x;
        let dy = other.y - self.y;
        (dx * dx + dy * dy).sqrt()
    }
}

/// Linear interpolation
pub fn lerp(start: f64, end: f64, t: f64) -> f64 {
    start + (end - start) * t.clamp(0.0, 1.0)
}

/// Ease-in-out quadratic smoothing for natural organic movement
pub fn ease_in_out_quad(t: f64) -> f64 {
    let t = t.clamp(0.0, 1.0);
    if t < 0.5 {
        2.0 * t * t
    } else {
        -1.0 + (4.0 - 2.0 * t) * t
    }
}

/// Hermite smoothstep curve
pub fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Parabolic arc for physical jumps:
/// Returns offset delta from base Y:
/// At progress = 0.0 -> 0.0
/// At progress = 0.5 -> -peak_height (highest elevation)
/// At progress = 1.0 -> 0.0 (landed)
pub fn parabolic_arc(progress: f64, peak_height: f64) -> f64 {
    let p = progress.clamp(0.0, 1.0);
    -4.0 * peak_height * p * (1.0 - p)
}

/// Lightweight deterministic XorShift64 pseudo-random generator
pub struct FastRng {
    state: u64,
}

impl FastRng {
    pub fn new(seed: u64) -> Self {
        let s = if seed == 0 { 0x853c49e6748fea9b } else { seed };
        Self { state: s }
    }

    pub fn from_time() -> Self {
        let millis = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_micros() as u64)
            .unwrap_or(123456789);
        Self::new(millis)
    }

    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    /// Return float in [0.0, 1.0)
    pub fn next_f64(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 / (1u64 << 53) as f64
    }

    /// Return float in [min, max]
    pub fn range_f64(&mut self, min: f64, max: f64) -> f64 {
        min + (max - min) * self.next_f64()
    }
}
