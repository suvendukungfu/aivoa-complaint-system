import React from 'react';

interface GlassPanelProps {
  variant?: 'light' | 'strong';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'light',
  className = '',
  style = {},
  children,
  onClick
}) => {
  const isStrong = variant === 'strong';

  const defaultStyle: React.CSSProperties = isStrong
    ? {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.035)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.18)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        ...style
      }
    : {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.015)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        ...style
      };

  return (
    <div
      className={`${isStrong ? 'liquid-glass-strong' : 'liquid-glass-light'} ${className}`}
      style={defaultStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
