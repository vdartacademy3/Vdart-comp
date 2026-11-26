import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useCompanionStore, RobotSize } from '../stores/companionStore';

export interface ResponsiveLayoutOptions {
  isAuthOpen?: boolean;
  isMinimalSettingsOpen?: boolean;
  isContextMenuOpen?: boolean;
  isRemindersOpen?: boolean;
}

export interface ResponsiveDimensions {
  robotWidth: number;
  robotHeight: number;
  chatWidth: number;
  chatHeight: number;
  questionWidth: number;
  questionHeight: number;
  reminderWidth: number;
  reminderHeight: number;
  windowWidth: number;
  windowHeight: number;
  shouldCenter: boolean;
  scaleFactor: number;
  robotSize: RobotSize;
}

/**
 * Calculates responsive robot, chat, question bubble, reminder bubble, dashboard, and desktop window dimensions.
 * Target sizes based on screen resolution and user-selected size preset (Module 1):
 * - Medium (Default - Reduced by ~30-35%):
 *   - 1080p: Robot height ~ 180–210 px
 * - Small: Robot height ~ 150–175 px
 * - Large: Robot height ~ 230–260 px
 * Scales cleanly across 1080p, 1440p, 4K, and multiple monitors.
 */
export function calculateResponsiveDimensions(
  screenWidth: number,
  screenHeight: number,
  isChatOpen: boolean,
  isDashboardOpen: boolean = false,
  isQuestionOpen: boolean = false,
  isReminderOpen: boolean = false,
  sizePreset: RobotSize = 'medium',
  options: ResponsiveLayoutOptions = {}
): ResponsiveDimensions {
  // Size preset multiplier (Small: ~0.82, Medium: 1.0, Large: ~1.25)
  const sizeMultiplier = sizePreset === 'small' ? 0.82 : sizePreset === 'large' ? 1.25 : 1.0;

  // Reduced target height: on 1080p display, base height ~ 190px (Medium)
  const baseHeight = Math.round((55 + screenHeight * (1 / 8)) * sizeMultiplier);
  
  const minH = sizePreset === 'small' ? 140 : sizePreset === 'large' ? 210 : 165;
  const maxH = sizePreset === 'small' ? 180 : sizePreset === 'large' ? 270 : 215;
  const robotHeight = Math.min(maxH, Math.max(minH, baseHeight));
  
  // Proportional aspect ratio (~0.74)
  const robotWidth = Math.round(robotHeight * 0.74);

  // Chat panel dimensions (compact, readable, proportional)
  const chatWidth = Math.min(360, Math.max(280, Math.round(screenWidth * 0.22)));
  const chatHeight = Math.min(420, Math.max(340, Math.round(screenHeight * 0.38)));

  // Question bubble dimensions
  const questionWidth = Math.min(350, Math.max(300, Math.round(screenWidth * 0.22)));
  const questionHeight = Math.min(340, Math.max(260, Math.round(screenHeight * 0.32)));

  // Reminder bubble dimensions
  const reminderWidth = Math.min(360, Math.max(320, Math.round(screenWidth * 0.22)));
  const reminderHeight = Math.min(360, Math.max(280, Math.round(screenHeight * 0.32)));

  const topBarHeight = 32;
  const padding = 12;

  // Window bounds when idle (only robot visible) vs active (robot + chat / question bubble side-by-side)
  const idleWindowWidth = robotWidth + padding;
  const idleWindowHeight = robotHeight + topBarHeight + padding;

  const chatWindowWidth = robotWidth + chatWidth + 20;
  const chatWindowHeight = Math.max(idleWindowHeight, chatHeight + topBarHeight + padding);

  const questionWindowWidth = robotWidth + questionWidth + 20;
  const questionWindowHeight = Math.max(idleWindowHeight, questionHeight + topBarHeight + padding);

  const reminderWindowWidth = robotWidth + reminderWidth + 20;
  const reminderWindowHeight = Math.max(idleWindowHeight, reminderHeight + topBarHeight + padding);

  // Dashboard modal dimensions when opened
  const dashboardWidth = Math.min(1080, Math.max(860, Math.round(screenWidth * 0.78)));
  const dashboardHeight = Math.min(760, Math.max(580, Math.round(screenHeight * 0.78)));

  let winW = idleWindowWidth;
  let winH = idleWindowHeight;
  let shouldCenter = false;

  if (isDashboardOpen) {
    winW = dashboardWidth;
    winH = dashboardHeight;
    shouldCenter = true;
  } else if (options.isAuthOpen) {
    winW = Math.min(480, Math.max(380, screenWidth - 40));
    winH = Math.min(680, Math.max(520, screenHeight - 60));
    shouldCenter = true;
  } else if (options.isMinimalSettingsOpen) {
    winW = Math.min(380, Math.max(340, screenWidth - 40));
    winH = Math.min(500, Math.max(420, screenHeight - 60));
    shouldCenter = true;
  } else if (isChatOpen) {
    winW = chatWindowWidth;
    winH = chatWindowHeight;
  } else if (options.isRemindersOpen || options.isContextMenuOpen) {
    winW = Math.max(idleWindowWidth, 250);
    winH = Math.max(idleWindowHeight, 360);
  } else if (isReminderOpen) {
    winW = reminderWindowWidth;
    winH = reminderWindowHeight;
  } else if (isQuestionOpen) {
    winW = questionWindowWidth;
    winH = questionWindowHeight;
  }

  return {
    robotWidth,
    robotHeight,
    chatWidth,
    chatHeight,
    questionWidth,
    questionHeight,
    reminderWidth,
    reminderHeight,
    windowWidth: winW,
    windowHeight: winH,
    shouldCenter,
    scaleFactor: robotHeight / 270,
    robotSize: sizePreset,
  };
}

export function useResponsiveDimensions(
  isChatOpen: boolean,
  isDashboardOpen: boolean = false,
  isQuestionOpen: boolean = false,
  isReminderOpen: boolean = false,
  options: ResponsiveLayoutOptions = {}
) {
  const { robotSize } = useCompanionStore();
  const isAuthOpen = Boolean(options.isAuthOpen);
  const isMinimalSettingsOpen = Boolean(options.isMinimalSettingsOpen);
  const isContextMenuOpen = Boolean(options.isContextMenuOpen);
  const isRemindersOpen = Boolean(options.isRemindersOpen);

  const [dimensions, setDimensions] = useState<ResponsiveDimensions>(() => {
    const w = typeof window !== 'undefined' ? (window.screen?.width || window.innerWidth || 1920) : 1920;
    const h = typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight || 1080) : 1080;
    return calculateResponsiveDimensions(w, h, isChatOpen, isDashboardOpen, isQuestionOpen, isReminderOpen, robotSize, {
      isAuthOpen,
      isMinimalSettingsOpen,
      isContextMenuOpen,
      isRemindersOpen,
    });
  });

  const updateDimensions = useCallback(() => {
    const w = typeof window !== 'undefined' ? (window.screen?.width || window.innerWidth || 1920) : 1920;
    const h = typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight || 1080) : 1080;
    const newDims = calculateResponsiveDimensions(w, h, isChatOpen, isDashboardOpen, isQuestionOpen, isReminderOpen, robotSize, {
      isAuthOpen,
      isMinimalSettingsOpen,
      isContextMenuOpen,
      isRemindersOpen,
    });
    setDimensions(newDims);

    // If running in Tauri, notify the native window to update its size and position smoothly
    if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => {
          invoke('update_window_layout', {
            width: newDims.windowWidth,
            height: newDims.windowHeight,
            center: newDims.shouldCenter,
          }).catch(() => {});
        })
        .catch(() => {});
    }
  }, [
    isChatOpen,
    isDashboardOpen,
    isQuestionOpen,
    isReminderOpen,
    robotSize,
    isAuthOpen,
    isMinimalSettingsOpen,
    isContextMenuOpen,
    isRemindersOpen,
  ]);

  useLayoutEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  useEffect(() => {
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  return dimensions;
}
