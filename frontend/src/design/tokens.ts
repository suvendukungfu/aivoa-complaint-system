// Modern Premium Design System Tokens
export const tokens = {
  colors: {
    // Canvas & Neutral Hierarchy
    bgApp: '#F8FAFC',
    bgSidebar: '#0F172A',
    bgSidebarSurface: '#1E293B',
    bgSurface: '#FFFFFF',
    bgSubtle: '#F1F5F9',
    bgHover: '#E2E8F0',
    bgActive: '#CBD5E1',

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderStrong: '#CBD5E1',
    borderFocus: '#6366F1',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textLight: '#CBD5E1',
    textInverse: '#FFFFFF',

    // Primary Accents (Modern Indigo-Blue)
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryLight: '#6366F1',
    primarySubtle: '#EEF2FF',
    primaryBorder: '#C7D2FE',
    primaryText: '#3730A3',

    // Semantic States
    success: '#10B981',
    successHover: '#059669',
    successSubtle: '#ECFDF5',
    successBorder: '#A7F3D0',
    successText: '#065F46',

    warning: '#F59E0B',
    warningHover: '#D97706',
    warningSubtle: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningText: '#92400E',

    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerSubtle: '#FEF2F2',
    dangerBorder: '#FECACA',
    dangerText: '#991B1B',

    info: '#0EA5E9',
    infoSubtle: '#F0F9FF',
    infoBorder: '#BAE6FD',
    infoText: '#0369A1'
  },

  radii: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
    elevated: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
    popover: '0 10px 25px -3px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
    modal: '0 20px 35px -5px rgba(15, 23, 42, 0.2), 0 10px 15px -5px rgba(15, 23, 42, 0.08)'
  },

  transitions: {
    fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '300ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
} as const;
