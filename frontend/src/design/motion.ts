// AIVOA Design System — Motion Tokens & Easings
export const motion = {
  durations: {
    fast: '120ms',
    normal: '180ms',
    slow: '280ms'
  },

  easings: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  transitions: {
    default: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    fast: 'all 120ms cubic-bezier(0.16, 1, 0.3, 1)',
    transform: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: 'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    colors: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease'
  }
};
