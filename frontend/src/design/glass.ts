// AIVOA Design System — Surface Hierarchy & Glass Tier Helpers
import React from 'react';

export type GlassTier = 'subtle' | 'standard' | 'strong' | 'decision';

export const getGlassStyle = (tier: GlassTier = 'standard', extra: React.CSSProperties = {}): React.CSSProperties => {
  switch (tier) {
    case 'subtle':
      return {
        background: 'rgba(255, 255, 255, 0.025)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '10px',
        ...extra
      };
    case 'standard':
      return {
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.10)',
        borderRadius: '12px',
        ...extra
      };
    case 'strong':
      return {
        background: 'rgba(255, 255, 255, 0.065)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.16)',
        borderRadius: '14px',
        ...extra
      };
    case 'decision':
      return {
        background: 'rgba(12, 13, 14, 0.88)',
        backdropFilter: 'blur(50px)',
        WebkitBackdropFilter: 'blur(50px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.22)',
        borderRadius: '16px',
        ...extra
      };
  }
};
