export const typography = {
  display: {
    fontSize: '30px',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    color: 'var(--text-primary)'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.01em',
    color: 'var(--text-primary)'
  },
  sectionHeaderLabel: {
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
    color: 'var(--text-primary)'
  },
  body: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.5,
    color: 'var(--text-primary)'
  },
  bodyMedium: {
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: 1.5,
    color: 'var(--text-primary)'
  },
  secondary: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.45,
    color: 'var(--text-secondary)'
  },
  metadata: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.4,
    color: 'var(--text-muted)'
  },
  code: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums' as const
  },
  tabularNumeral: {
    fontVariantNumeric: 'tabular-nums' as const
  }
} as const;
