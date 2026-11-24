import { useCompanionStore } from '../stores/companionStore';

export interface DesktopBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
}

export interface VirtualDesktopBounds {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  total_width: number;
  total_height: number;
  monitor_count: number;
}

export interface MonitorInfo {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
  is_primary: boolean;
}

export type MovementMode = 
  | 'idle' 
  | 'walk' 
  | 'walk_left'
  | 'walk_right'
  | 'walk_up'
  | 'walk_down'
  | 'walk_diagonal'
  | 'run' 
  | 'jump'
  | 'wander' 
  | 'follow_cursor' 
  | 'circle'
  | 'move_edge'
  | 'move_to'
  | 'return_home';

export type MovementSpeed = 'slow' | 'normal' | 'fast' | 'custom';
export type BoundaryMode = 'current_monitor' | 'entire_desktop';

export const SPEED_MAP: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 60,
  normal: 100,
  fast: 260,
};

const POSITION_STORAGE_KEY = 'vcamp_last_position';
const SPEED_STORAGE_KEY = 'vcamp_movement_speed';
const BOUNDARY_STORAGE_KEY = 'vcamp_movement_boundary';
const CUSTOM_SPEED_STORAGE_KEY = 'vcamp_custom_speed';

class DesktopMovementService {
  private activeMode: MovementMode = 'idle';
  private currentX = 24;
  private currentY = 700;
  private directionX = 1; // 1 = right, -1 = left
  private speedSetting: MovementSpeed = 'normal';
  private customSpeedPx = 150;
  private boundaryMode: BoundaryMode = 'current_monitor';
  private isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
  private listeners: ((mode: MovementMode, pos: { x: number; y: number }, dir: number) => void)[] = [];
  private unlistenList: (() => void)[] = [];

  constructor() {
    this.loadSavedSettings();
    this.setupTauriEventListeners();
  }

  private loadSavedSettings() {
    try {
      const savedSpeed = localStorage.getItem(SPEED_STORAGE_KEY) as MovementSpeed;
      if (savedSpeed) {
        this.speedSetting = savedSpeed;
      }
      const savedCustom = localStorage.getItem(CUSTOM_SPEED_STORAGE_KEY);
      if (savedCustom) {
        this.customSpeedPx = Math.max(30, Math.min(500, parseInt(savedCustom, 10) || 150));
      }
      const savedBoundary = localStorage.getItem(BOUNDARY_STORAGE_KEY) as BoundaryMode;
      if (savedBoundary === 'entire_desktop' || savedBoundary === 'current_monitor') {
        this.boundaryMode = savedBoundary;
      }
      const savedPos = localStorage.getItem(POSITION_STORAGE_KEY);
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          this.currentX = parsed.x;
          this.currentY = parsed.y;
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }

  private async setupTauriEventListeners() {
    if (!this.isTauri) return;

    try {
      const { listen } = await import('@tauri-apps/api/event');

      const u1 = await listen<{
        mode: string;
        x: number;
        y: number;
        direction?: number;
        progress?: number;
        is_jumping?: boolean;
      }>('vcamp:movement-step', (event) => {
        this.currentX = Math.round(event.payload.x);
        this.currentY = Math.round(event.payload.y);
        if (typeof event.payload.direction === 'number') {
          this.directionX = event.payload.direction;
          useCompanionStore.getState().setMovementDirection(this.directionX);
        }
        if (typeof event.payload.is_jumping === 'boolean') {
          useCompanionStore.getState().setJumpState({
            isJumping: event.payload.is_jumping,
            progress: event.payload.progress ?? 0,
          });
        }
        this.notify();
      });
      this.unlistenList.push(u1);

      const u2 = await listen<number>('vcamp:movement-direction', (event) => {
        this.directionX = event.payload;
        useCompanionStore.getState().setMovementDirection(this.directionX);
        this.notify();
      });
      this.unlistenList.push(u2);

      const u3 = await listen('vcamp:movement-stopped', () => {
        this.activeMode = 'idle';
        useCompanionStore.getState().triggerAction('idle');
        useCompanionStore.getState().setJumpState({ isJumping: false, progress: 0 });
        this.savePosition(this.currentX, this.currentY);
        this.notify();
      });
      this.unlistenList.push(u3);

      const u4 = await listen<{ x: number; y: number }>('vcamp:window-moved', (event) => {
        this.currentX = Math.round(event.payload.x);
        this.currentY = Math.round(event.payload.y);
        this.savePosition(this.currentX, this.currentY);
        this.notify();
      });
      this.unlistenList.push(u4);
    } catch (err) {
      console.warn('[DesktopMovementService] Error setting up event listeners:', err);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const [posX, posY] = await invoke<[number, number]>('get_window_position');
        this.currentX = Math.round(posX);
        this.currentY = Math.round(posY);
      } catch {}
    }
  }

  public subscribe(cb: (mode: MovementMode, pos: { x: number; y: number }, dir: number) => void): () => void {
    this.listeners.push(cb);
    cb(this.activeMode, { x: this.currentX, y: this.currentY }, this.directionX);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.activeMode, { x: this.currentX, y: this.currentY }, this.directionX));
  }

  public getMode(): MovementMode {
    return this.activeMode;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }

  public getDirection(): number {
    return this.directionX;
  }

  public getSpeed(): MovementSpeed {
    return this.speedSetting;
  }

  public getEffectiveSpeedPx(): number {
    if (this.speedSetting === 'custom') {
      return this.customSpeedPx;
    }
    return SPEED_MAP[this.speedSetting] || 100;
  }

  public setSpeed(speed: MovementSpeed) {
    this.speedSetting = speed;
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, speed);
    } catch {}
  }

  public setCustomSpeed(px: number) {
    this.customSpeedPx = Math.max(30, Math.min(500, px));
    this.speedSetting = 'custom';
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, 'custom');
      localStorage.setItem(CUSTOM_SPEED_STORAGE_KEY, this.customSpeedPx.toString());
    } catch {}
  }

  public getBoundaryMode(): BoundaryMode {
    return this.boundaryMode;
  }

  public setBoundaryMode(mode: BoundaryMode) {
    this.boundaryMode = mode;
    try {
      localStorage.setItem(BOUNDARY_STORAGE_KEY, mode);
    } catch {}
  }

  public savePosition(x: number, y: number) {
    this.currentX = Math.round(x);
    this.currentY = Math.round(y);
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ x: this.currentX, y: this.currentY }));
    } catch {}
  }

  public async startDrag() {
    await this.stopMovement();
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_window_drag');
      } catch {}
    }
  }

  // Horizontal Walking
  public async startWalk(direction = 1) {
    if (direction < 0) {
      await this.walkLeft();
    } else {
      await this.walkRight();
    }
  }

  public async walkLeft() {
    await this.stopMovement();
    this.activeMode = 'walk_left';
    this.directionX = -1;
    useCompanionStore.getState().setMovementDirection(-1);
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx();

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_walk', {
          direction: -1.0,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('walkLeft failed:', err);
      }
    }
    this.notify();
  }

  public async walkRight() {
    await this.stopMovement();
    this.activeMode = 'walk_right';
    this.directionX = 1;
    useCompanionStore.getState().setMovementDirection(1);
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx();

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_walk', {
          direction: 1.0,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('walkRight failed:', err);
      }
    }
    this.notify();
  }

  // Vertical Movement
  public async walkUp() {
    await this.stopMovement();
    this.activeMode = 'walk_up';
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx();

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_vertical_walk', {
          direction: -1.0,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('walkUp failed:', err);
      }
    }
    this.notify();
  }

  public async walkDown() {
    await this.stopMovement();
    this.activeMode = 'walk_down';
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx();

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_vertical_walk', {
          direction: 1.0,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('walkDown failed:', err);
      }
    }
    this.notify();
  }

  // Diagonal Movement
  public async walkDiagonal(dirX: number, dirY: number) {
    await this.stopMovement();
    this.activeMode = 'walk_diagonal';
    this.directionX = dirX >= 0 ? 1 : -1;
    useCompanionStore.getState().setMovementDirection(this.directionX);
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx();

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_diagonal_walk', {
          dirX: dirX >= 0 ? 1.0 : -1.0,
          dirY: dirY >= 0 ? 1.0 : -1.0,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('walkDiagonal failed:', err);
      }
    }
    this.notify();
  }

  // Sprint / Run Across Desktop
  public async startRun(direction = 1) {
    await this.stopMovement();
    this.activeMode = 'run';
    this.directionX = direction >= 0 ? 1 : -1;
    useCompanionStore.getState().setMovementDirection(this.directionX);
    useCompanionStore.getState().triggerAction('run', 999999);
    const speed = Math.max(260, this.getEffectiveSpeedPx() * 1.8);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_run', {
          direction: this.directionX,
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('startRun failed:', err);
      }
    }
    this.notify();
  }

  // Physics Jump Arc
  public async startJump(heightPx = 100, durationMs = 700) {
    await this.stopMovement();
    this.activeMode = 'jump';
    useCompanionStore.getState().triggerAction('play', durationMs + 200);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_jump', {
          height: heightPx,
          durationMs,
        });
      } catch (err) {
        console.warn('startJump failed:', err);
      }
    }
    this.notify();
  }

  // Autonomous Wander Mode
  public async startWander() {
    await this.stopMovement();
    this.activeMode = 'wander';
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = this.getEffectiveSpeedPx() * 0.85;

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_wander', {
          speed,
          boundary: this.boundaryMode,
        });
      } catch (err) {
        console.warn('startWander failed:', err);
      }
    }
    this.notify();
  }

  // Follow Cursor Mode
  public async startFollowCursor(standoffPx = 140) {
    await this.stopMovement();
    this.activeMode = 'follow_cursor';
    useCompanionStore.getState().triggerAction('walk', 999999);
    const speed = Math.max(140, this.getEffectiveSpeedPx() * 1.2);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_follow_cursor', {
          standoff: standoffPx,
          speed,
        });
      } catch (err) {
        console.warn('startFollowCursor failed:', err);
      }
    }
    this.notify();
  }

  // Circular Orbital Motion
  public async startCircle(radius = 80, durationMs = 2400) {
    await this.stopMovement();
    this.activeMode = 'circle';
    useCompanionStore.getState().triggerAction('walk', durationMs + 100);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_circle', {
          radius,
          durationMs,
        });
      } catch (err) {
        console.warn('startCircle failed:', err);
      }
    }
    this.notify();
  }

  // Move to Specific Edge or Center
  public async moveToEdge(edge: 'left' | 'right' | 'top' | 'bottom' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center') {
    await this.stopMovement();
    this.activeMode = 'move_edge';
    useCompanionStore.getState().triggerAction('walk', 850);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('move_robot_to_edge', {
          edge,
          durationMs: 750,
        });
      } catch (err) {
        console.warn('moveToEdge failed:', err);
      }
    }
    this.notify();
  }

  // Move to Custom (X, Y) Coordinates
  public async moveToPoint(x: number, y: number, durationMs = 700) {
    await this.stopMovement();
    this.activeMode = 'move_to';
    useCompanionStore.getState().triggerAction('walk', durationMs + 100);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('move_robot_to', {
          x,
          y,
          durationMs,
        });
      } catch (err) {
        console.warn('moveToPoint failed:', err);
      }
    }
    this.notify();
  }

  // Return to Home (docked at bottom-left 24px)
  public async returnToHome() {
    await this.stopMovement();
    this.activeMode = 'return_home';
    useCompanionStore.getState().triggerAction('greet', 1800);

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('move_robot_home');
      } catch (err) {
        console.warn('returnToHome failed:', err);
      }
    }
    this.notify();
  }

  // Stop all active movement
  public async stopMovement() {
    this.activeMode = 'idle';
    useCompanionStore.getState().triggerAction('idle');
    useCompanionStore.getState().setJumpState({ isJumping: false, progress: 0 });

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('stop_native_movement');
      } catch {}
    }
    this.notify();
  }

  // Center on screen ("Come Here")
  public async comeHere() {
    await this.moveToEdge('center');
    useCompanionStore.getState().triggerAction('greet', 2000);
  }

  // 3D Depth (Z-Axis) Control
  public setRobotZ(z: number) {
    useCompanionStore.getState().setRobotZ(z);
  }

  public getRobotZ(): number {
    return useCompanionStore.getState().robotZ;
  }

  // Query Monitors and Virtual Desktop Bounds
  public async getAvailableMonitors(): Promise<MonitorInfo[]> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<MonitorInfo[]>('get_available_monitors');
      } catch {}
    }
    return [];
  }

  public async getVirtualDesktopBounds(): Promise<VirtualDesktopBounds | null> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<VirtualDesktopBounds>('get_virtual_desktop_bounds');
      } catch {}
    }
    return null;
  }
}

export const desktopMovementService = new DesktopMovementService();
