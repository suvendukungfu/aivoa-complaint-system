/**
 * AIVOA Enterprise Design System Tokens
 * Restrained, high-density, professional palette for Pharmaceutical QMS.
 */

export const tokens = {
  colors: {
    bgApp: '#F8F9FA',
    bgSurface: '#FFFFFF',
    bgSubtle: '#F1F3F5',
    bgHover: '#E9ECEF',
    bgActive: '#DEE2E6',

    border: '#E4E7EC',
    borderStrong: '#D0D5DD',
    borderFocus: '#2563EB',

    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    textLight: '#9CA3AF',

    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    primarySubtle: '#EFF6FF',
    primaryBorder: '#BFDBFE',

    success: '#059669',
    successSubtle: '#ECFDF5',
    successBorder: '#A7F3D0',
    successText: '#065F46',

    warning: '#D97706',
    warningSubtle: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningText: '#92400E',

    danger: '#DC2626',
    dangerSubtle: '#FEF2F2',
    dangerBorder: '#FECACA',
    dangerText: '#991B1B',

    neutral: '#4B5563',
    neutralSubtle: '#F3F4F6',
    neutralBorder: '#E5E7EB',
  },

  typography: {
    fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    sizes: {
      title: '20px',
      section: '15px',
      body: '13px',
      secondary: '12px',
      metadata: '11px',
      xs: '10px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
  },

  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
    card: '0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
    popover: '0 4px 12px -2px rgba(16, 24, 40, 0.12), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
    modal: '0 12px 24px -4px rgba(16, 24, 40, 0.16), 0 4px 8px -2px rgba(16, 24, 40, 0.06)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
