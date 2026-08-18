// AIVOA Design System — Typography
export const typography = {
  fontFamily: {
    sans: "var(--font-sans, 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
    mono: "var(--font-mono, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)"
  },

  scale: {
    pageTitle: {
      fontSize: '28px',
      lineHeight: '1.15',
      fontWeight: '600',
      letterSpacing: '-0.03em'
    },
    sectionTitle: {
      fontSize: '18px',
      lineHeight: '1.25',
      fontWeight: '600',
      letterSpacing: '-0.02em'
    },
    cardTitle: {
      fontSize: '14.5px',
      lineHeight: '1.35',
      fontWeight: '600',
      letterSpacing: '-0.01em'
    },
    body: {
      fontSize: '13.5px',
      lineHeight: '1.5',
      fontWeight: '400'
    },
    bodySmall: {
      fontSize: '12.5px',
      lineHeight: '1.45',
      fontWeight: '400'
    },
    metadata: {
      fontSize: '11px',
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const
    },
    code: {
      fontSize: '12px',
      lineHeight: '1.4',
      fontFamily: 'var(--font-mono)'
    }
  }
};
