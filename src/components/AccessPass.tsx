import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, RotateCw } from 'lucide-react';
import { PORTFOLIO_PROFILE } from '../data/portfolio';
import { gsap, prefersReducedMotion } from '../lib/gsapSetup';

function generateQrMatrix(seedText: string, size = 19): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isEdge = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        matrix[r0 + r][c0 + c] = isEdge || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (hash >>> 28) % 2 === 0;
    }
  }

  return matrix;
}

export function AccessPass() {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltLayerRef = useRef<HTMLDivElement>(null);
  const flipLayerRef = useRef<HTMLDivElement>(null);

  const rotateXTo = useRef<((value: number) => void) | null>(null);
  const rotateYTo = useRef<((value: number) => void) | null>(null);

  const [flipped, setFlipped] = useState(false);
  const [shine, setShine] = useState({ x: 50, y: 50, active: false });
  const [imgFailed, setImgFailed] = useState(false);

  const qrMatrix = useMemo(() => generateQrMatrix(PORTFOLIO_PROFILE.githubHandle, 19), []);

  useEffect(() => {
    const tiltEl = tiltLayerRef.current;
    if (!tiltEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set(tiltEl, { transformPerspective: 1000, transformStyle: 'preserve-3d' });
      rotateXTo.current = gsap.quickTo(tiltEl, 'rotationX', { duration: 0.35, ease: 'power3.out' });
      rotateYTo.current = gsap.quickTo(tiltEl, 'rotationY', { duration: 0.35, ease: 'power3.out' });
    }, tiltEl);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const flipEl = flipLayerRef.current;
    if (!flipEl) return;

    if (prefersReducedMotion()) {
      gsap.set(flipEl, { rotationY: flipped ? 180 : 0 });
      return;
    }

    gsap.to(flipEl, {
      rotationY: flipped ? 180 : 0,
      duration: 0.62,
      ease: 'back.out(1.2)',
    });
  }, [flipped]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 16;
    const rx = (0.5 - py) * 16;

    rotateXTo.current?.(rx);
    rotateYTo.current?.(ry);
    setShine({ x: px * 100, y: py * 100, active: true });
  };

  const handleMouseLeave = () => {
    rotateXTo.current?.(0);
    rotateYTo.current?.(0);
    setShine((prev) => ({ ...prev, active: false }));
  };

  return (
    <div className="w-full max-w-[380px] mx-auto lg:mx-0 lg:ml-auto">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="pass-perspective select-none"
      >
        <div ref={tiltLayerRef} style={{ transformStyle: 'preserve-3d' }}>
          <div
            ref={flipLayerRef}
            className="relative w-full min-h-[430px]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* FRONT FACE */}
            <div
              className="pass-face absolute inset-0 flex flex-col justify-between rounded-xl overflow-hidden theme-transition"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
              }}
              aria-hidden={flipped}
            >
              {/* Light holographic sheen overlay reacting to cursor */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
                style={{
                  opacity: shine.active ? 0.24 : 0,
                  background: `radial-gradient(circle 220px at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.85), rgba(216,180,254,0.28) 45%, transparent 75%)`,
                  mixBlendMode: 'overlay',
                }}
              />

              {/* Solid accent top band */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <span className="font-mono-tabular text-[11px] tracking-wider uppercase font-medium">
                  Developer Access Pass
                </span>
                <span className="font-mono-tabular text-[11px] opacity-90">NG · 2026</span>
              </div>

              {/* Pass Body */}
              <div className="flex-1 flex flex-col justify-between p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="relative h-22 w-22 shrink-0 overflow-hidden rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    {!imgFailed ? (
                      <img
                        src={PORTFOLIO_PROFILE.avatarPath}
                        alt="Portrait of Trinity Ogwezi"
                        referrerPolicy="no-referrer"
                        onError={() => setImgFailed(true)}
                        className="h-full w-full object-cover"
                        style={{
                          transform: 'scale(2.05)',
                          transformOrigin: '41% 21%',
                        }}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center font-display text-xl font-bold"
                        style={{ color: 'var(--accent)' }}
                      >
                        TO
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <h2
                      className="font-display text-xl font-bold tracking-tight leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {PORTFOLIO_PROFILE.name}
                    </h2>
                    <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {PORTFOLIO_PROFILE.role}
                    </p>
                  </div>
                </div>

                {/* Clean hairline metadata rows */}
                <dl
                  className="mt-6 divide-y text-xs"
                  style={{
                    borderTop: '1px solid var(--border-hairline)',
                    borderBottom: '1px solid var(--border-hairline)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-center justify-between py-2.5">
                    <dt style={{ color: 'var(--text-muted)' }}>Location</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {PORTFOLIO_PROFILE.location}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5" style={{ borderColor: 'var(--border-hairline)' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Status</dt>
                    <dd className="font-medium" style={{ color: 'var(--accent)' }}>
                      {PORTFOLIO_PROFILE.status}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5" style={{ borderColor: 'var(--border-hairline)' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Focus</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enterprise & Full-Stack
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    ID · TO-LAGOS
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    tabIndex={flipped ? -1 : 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Flip pass</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="pass-face pass-face-back absolute inset-0 flex flex-col justify-between rounded-xl overflow-hidden theme-transition"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
              }}
              aria-hidden={!flipped}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <span className="font-mono-tabular text-[11px] tracking-wider uppercase font-medium">
                  Verification & Links
                </span>
                <span className="font-mono-tabular text-[11px] opacity-90">PASS BACK</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-between p-5 text-center">
                <div className="mt-2 flex flex-col items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    <svg
                      width="114"
                      height="114"
                      viewBox="0 0 19 19"
                      role="img"
                      aria-label="QR code pattern linking to github.com/mazino-ux"
                    >
                      {qrMatrix.map((row, r) =>
                        row.map((filled, c) =>
                          filled ? (
                            <rect
                              key={`${r}-${c}`}
                              x={c}
                              y={r}
                              width="1"
                              height="1"
                              fill="currentColor"
                              style={{ color: 'var(--accent)' }}
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>

                  <a
                    href={PORTFOLIO_PROFILE.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={flipped ? 0 : -1}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:opacity-80"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>{PORTFOLIO_PROFILE.githubHandle}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-sm font-medium max-w-[26ch] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {PORTFOLIO_PROFILE.tagline}
                </p>

                <div className="w-full flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-hairline)' }}>
                  <span className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Lagos, Nigeria
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    tabIndex={flipped ? 0 : -1}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Flip pass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
