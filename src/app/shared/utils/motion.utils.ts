const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const MOTION_TOKENS = {
  viewSwitchDuration: '150ms',
  interactionDuration: '120ms',
  dialogEnterDuration: '160ms',
  dialogExitDuration: '120ms',
  toastEnterDuration: '180ms',
  toastExitDuration: '120ms'
} as const;

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

export const getDialogAnimationDurations = () => {
  if (prefersReducedMotion()) {
    return {
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms'
    };
  }

  return {
    enterAnimationDuration: MOTION_TOKENS.dialogEnterDuration,
    exitAnimationDuration: MOTION_TOKENS.dialogExitDuration
  };
};
