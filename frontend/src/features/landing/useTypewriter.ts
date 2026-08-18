import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // ms per char
  startDelay?: number; // ms delay before typing
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 40,
  startDelay = 450,
  onComplete
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion safely
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayedText(text);
      setIsTyping(false);
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }

    let timeoutId: number;
    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);

    // Initial delay before typing begins
    const delayId = window.setTimeout(() => {
      setIsTyping(true);

      const intervalId = window.setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayedText(text.slice(0, currentIndex));
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      }, speed);

      timeoutId = intervalId;
    }, startDelay);

    return () => {
      clearTimeout(delayId);
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [text, speed, startDelay, onComplete]);

  return { displayedText, isTyping, isComplete };
}

export default useTypewriter;
