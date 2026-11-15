import { useEffect, useRef, useState } from 'react';

interface TrailDot {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export function BubbleCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [popped, setPopped] = useState(false);

  const mainBubbleRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const bubblePos = useRef({ x: -100, y: -100 });
  const lastTrailPos = useRef({ x: -100, y: -100 });
  const trails = useRef<TrailDot[]>([]);
  const bursts = useRef<BurstParticle[]>([]);
  const nextId = useRef(1);
  const hoveringRef = useRef(false);
  const poppedRef = useRef(false);
  const popTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      const active = finePointer.matches && !reducedMotion.matches;
      setEnabled(active);
      if (active) {
        document.documentElement.classList.add('bubble-cursor-active');
      } else {
        document.documentElement.classList.remove('bubble-cursor-active');
      }
    };

    evaluate();
    finePointer.addEventListener('change', evaluate);
    reducedMotion.addEventListener('change', evaluate);

    return () => {
      finePointer.removeEventListener('change', evaluate);
      reducedMotion.removeEventListener('change', evaluate);
      document.documentElement.classList.remove('bubble-cursor-active');
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const isInteractive = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('a, button, input, textarea, select, [role="button"]'));
    };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      const overInteractive = isInteractive(e.target);
      if (overInteractive !== hoveringRef.current) {
        hoveringRef.current = overInteractive;
        setHovering(overInteractive);
      }

      const dx = e.clientX - lastTrailPos.current.x;
      const dy = e.clientY - lastTrailPos.current.y;
      if (dx * dx + dy * dy > 320) {
        lastTrailPos.current = { x: e.clientX, y: e.clientY };
        trails.current.push({
          id: nextId.current++,
          x: bubblePos.current.x,
          y: bubblePos.current.y,
          size: 6 + Math.random() * 5,
          opacity: 0.45,
        });
        if (trails.current.length > 14) {
          trails.current.shift();
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      poppedRef.current = true;
      setPopped(true);
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
      popTimerRef.current = window.setTimeout(() => {
        poppedRef.current = false;
        setPopped(false);
      }, 180);

      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5) * 0.4;
        const speed = 2.2 + Math.random() * 2.2;
        bursts.current.push({
          id: nextId.current++,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 4 + Math.random() * 4,
        });
      }
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const renderLoop = () => {
      const lerp = 0.22;
      bubblePos.current.x += (mousePos.current.x - bubblePos.current.x) * lerp;
      bubblePos.current.y += (mousePos.current.y - bubblePos.current.y) * lerp;

      if (mainBubbleRef.current) {
        const scale = poppedRef.current ? 1.45 : hoveringRef.current ? 1.65 : 1;
        mainBubbleRef.current.style.transform = `translate3d(${bubblePos.current.x}px, ${bubblePos.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      if (trailContainerRef.current) {
        trails.current = trails.current
          .map((t) => ({ ...t, opacity: t.opacity - 0.025, size: t.size * 0.985 }))
          .filter((t) => t.opacity > 0.02);

        bursts.current = bursts.current
          .map((b) => ({
            ...b,
            x: b.x + b.vx,
            y: b.y + b.vy,
            vx: b.vx * 0.92,
            vy: b.vy * 0.92,
            life: b.life - 0.06,
          }))
          .filter((b) => b.life > 0);

        const nodes = trailContainerRef.current;
        let html = '';
        for (const t of trails.current) {
          html += `<span style="position:fixed;left:0;top:0;width:${t.size}px;height:${t.size}px;border-radius:9999px;transform:translate3d(${t.x}px,${t.y}px,0) translate(-50%,-50%);background:var(--accent);opacity:${t.opacity.toFixed(2)};pointer-events:none;"></span>`;
        }
        for (const b of bursts.current) {
          html += `<span style="position:fixed;left:0;top:0;width:${b.size}px;height:${b.size}px;border-radius:9999px;transform:translate3d(${b.x}px,${b.y}px,0) translate(-50%,-50%);border:1.5px solid var(--accent);opacity:${b.life.toFixed(2)};pointer-events:none;"></span>`;
        }
        nodes.innerHTML = html;
      }

      rafId = window.requestAnimationFrame(renderLoop);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = window.requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.cancelAnimationFrame(rafId);
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <div ref={trailContainerRef} />
      <div
        ref={mainBubbleRef}
        className="fixed left-0 top-0 rounded-full transition-[opacity,border-width,background-color] duration-150"
        style={{
          width: 26,
          height: 26,
          opacity: visible ? (popped ? 0.15 : 1) : 0,
          backgroundColor: hovering
            ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
            : 'color-mix(in srgb, var(--accent) 20%, transparent)',
          border: '1.5px solid var(--accent)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
