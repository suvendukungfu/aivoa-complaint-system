import React, { useEffect, useRef } from 'react';

interface CinematicBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext ? canvas.getContext('2d', { alpha: false }) : null;
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates (-1 to 1)
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mousePosRef.current.targetX = normX;
      mousePosRef.current.targetY = normY;
    };

    window.addEventListener('resize', handleResize);
    if (!prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Procedural Particles (Representing Quality Data Verification Points)
    const particleCount = Math.min(width > 768 ? 40 : 20, 50);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.2 + 0.6,
      baseAlpha: Math.random() * 0.15 + 0.05
    }));

    let gridOffset = 0;

    const render = () => {
      // Smooth mouse interpolation
      if (!prefersReducedMotion) {
        mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
        mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;
      }

      const offsetX = mousePosRef.current.x * 8; // Max 8px subtle parallax
      const offsetY = mousePosRef.current.y * 8;

      // 1. Dark Neutral Background Canvas
      ctx.fillStyle = '#080B10';
      ctx.fillRect(0, 0, width, height);

      // 2. Soft Radial Vignette from Mouse Target (subtle ambient light)
      const radialX = (mousePosRef.current.x * 0.5 + 0.5) * width;
      const radialY = (mousePosRef.current.y * 0.5 + 0.5) * height;
      const gradient = ctx.createRadialGradient(
        radialX,
        radialY,
        0,
        radialX,
        radialY,
        width * 0.75
      );
      gradient.addColorStop(0, 'rgba(30, 41, 59, 0.22)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
      gradient.addColorStop(1, 'rgba(8, 11, 16, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Fine Laboratory Instrumentation Grid
      const gridSize = 64;
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.024)';

      gridOffset = (gridOffset + 0.08) % gridSize;

      ctx.beginPath();
      // Vertical lines
      for (let x = (offsetX % gridSize); x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal lines
      for (let y = ((offsetY + gridOffset) % gridSize); y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 4. Subtle Crosshairs / Measurement Ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const tickSpacing = gridSize * 4;
      for (let x = ((offsetX + 32) % tickSpacing); x < width; x += tickSpacing) {
        for (let y = ((offsetY + 32) % tickSpacing); y < height; y += tickSpacing) {
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      // 5. Ambient Particles
      if (!prefersReducedMotion) {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x + offsetX * 0.5, p.y + offsetY * 0.5, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 180, 252, ${p.baseAlpha})`;
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none'
      }}
      aria-hidden="true"
    />
  );
};

export default CinematicBackground;
