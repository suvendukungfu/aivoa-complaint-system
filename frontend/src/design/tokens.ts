export const tokens = {
  colors: {
    // Neutral Canvas & Surfaces
    bgApp: '#F7F8FA',
    bgSidebar: '#F9FAFB',
    bgSurface: '#FFFFFF',
    bgSubtle: '#F3F4F6',
    bgHover: '#E5E7EB',
    bgActive: '#D1D5DB',

    // Borders
    border: '#E5E7EB',
    borderStrong: '#D1D5DB',
    borderFocus: '#2563EB',

    // Typography
    textPrimary: '#17191C',
    textSecondary: '#626873',
    textMuted: '#8A9099',
    textLight: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Primary Brand / Focal Accent
    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    primarySubtle: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    primaryText: '#1E3A8A',

    // Semantic States (Restrained)
    success: '#15803D',
    successSubtle: '#F0FDF4',
    successBorder: '#BBF7D0',
    successText: '#166534',

    warning: '#B45309',
    warningSubtle: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningText: '#92400E',

    danger: '#B91C1C',
    dangerSubtle: '#FEF2F2',
    dangerBorder: '#FECACA',
    dangerText: '#991B1B',

    info: '#0369A1',
    infoSubtle: '#F0F9FF',
    infoBorder: '#BAE6FD',
    infoText: '#075985'
  },

  typography: {
    fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
    sizes: {
      display: '30px',
      titlePage: '22px',
      titleSection: '16px',
      titleCard: '14px',
      body: '13px',
      secondary: '12px',
      metadata: '11px'
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625
    }
  },

  radii: {
    badge: '3px',
    input: '5px',
    button: '5px',
    card: '6px',
    modal: '8px'
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
    card: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.03)',
    popover: '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 6px -2px rgba(16, 24, 40, 0.04)',
    modal: '0 12px 24px -4px rgba(16, 24, 40, 0.12), 0 4px 8px -2px rgba(16, 24, 40, 0.04)'
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    huge: '32px'
  },

  heights: {
    inputSm: '28px',
    inputMd: '32px',
    inputLg: '36px',
    buttonSm: '28px',
    buttonMd: '32px',
    sidebar: '100vh',
    topbar: '52px'
  },

  transitions: {
    fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '180ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
} as const;

export type Tokens = typeof tokens;
