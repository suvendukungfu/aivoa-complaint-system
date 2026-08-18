import React from 'react';
import { useTypewriter } from './useTypewriter';

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 40,
  startDelay = 500,
  className = '',
  style = {},
  onComplete
}) => {
  const { displayedText, isTyping, isComplete } = useTypewriter({
    text,
    speed,
    startDelay,
    onComplete
  });

  return (
    <span className={`typewriter-container ${className}`} style={{ display: 'inline', ...style }}>
      <span>{displayedText}</span>
      {!isComplete && (
        <span
          className="typewriter-cursor"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '0.9em',
            backgroundColor: '#FFFFFF',
            marginLeft: '4px',
            verticalAlign: 'middle',
            opacity: isTyping ? 1 : 0.8,
            animation: isTyping ? 'cursorBlink 0.8s steps(2, start) infinite' : 'none'
          }}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default Typewriter;
