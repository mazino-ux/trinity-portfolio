import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../lib/gsapSetup';

type GameMode = 'bug-squash' | 'seat-blitz';
type BugKind = 'syntax' | 'race' | 'memory';

interface BugEntity {
  id: number;
  kind: BugKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  points: number;
  wobblePhase: number;
}

interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  label: string;
}

type SeatState = 'idle' | 'hot' | 'vip' | 'sold';

interface SeatTile {
  id: string;
  label: string;
  state: SeatState;
  expiresAt: number;
}

const BEST_BUG_KEY = 'trinity_bug_squash_best';
const BEST_SEAT_KEY = 'trinity_seat_blitz_best';

function readScore(key: string): number {
  try {
    const val = window.localStorage.getItem(key);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

function saveScore(key: string, score: number): void {
  try {
    window.localStorage.setItem(key, String(score));
  } catch {
    // Ignore storage errors
  }
}

function playSynthTone(freq: number, duration = 0.07, type: OscillatorType = 'triangle') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // Ignore audio context restrictions
  }
}

function createInitialSeats(): SeatTile[] {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seats: SeatTile[] = [];
  for (const row of rows) {
    for (let col = 1; col <= 6; col++) {
      seats.push({
        id: `${row}${col}`,
        label: `${row}${col}`,
        state: 'idle',
        expiresAt: 0,
      });
    }
  }
  return seats;
}

export function BugSquashGame() {
  const [mode, setMode] = useState<GameMode>('bug-squash');
  const [soundOn, setSoundOn] = useState(true);

  // Bug Squash State
  const arenaRef = useRef<HTMLDivElement>(null);
  const burstLayerRef = useRef<HTMLDivElement>(null);
  const [bugState, setBugState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [bugScore, setBugScore] = useState(0);
  const [bestBugScore, setBestBugScore] = useState<number>(() => readScore(BEST_BUG_KEY));
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [bugs, setBugs] = useState<BugEntity[]>([]);
  const [popups, setPopups] = useState<FloatingPopup[]>([]);

  const bugsRef = useRef<BugEntity[]>([]);
  const livesRef = useRef(3);
  const bugScoreRef = useRef(0);
  const squashedCountRef = useRef(0);
  const lastSquashTimeRef = useRef(0);
  const comboRef = useRef(1);
  const nextBugId = useRef(1);
  const lastFrameRef = useRef(0);
  const spawnAccumRef = useRef(0);

  // Seat Lock Blitz State
  const [seatState, setSeatState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [seats, setSeats] = useState<SeatTile[]>(() => createInitialSeats());
  const [seatScore, setSeatScore] = useState(0);
  const [bestSeatScore, setBestSeatScore] = useState<number>(() => readScore(BEST_SEAT_KEY));
  const [seatStreak, setSeatStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const seatScoreRef = useRef(0);

  const speedMultiplier = 1 + Math.min(2.3, squashedCountRef.current * 0.05);

  const triggerBurst = (x: number, y: number) => {
    if (!burstLayerRef.current || prefersReducedMotion()) return;
    const container = burstLayerRef.current;
    const fragments: HTMLSpanElement[] = [];

    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.style.position = 'absolute';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.width = '6px';
      dot.style.height = '6px';
      dot.style.borderRadius = '9999px';
      dot.style.backgroundColor = 'var(--accent)';
      dot.style.pointerEvents = 'none';
      container.appendChild(dot);
      fragments.push(dot);

      const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
      const dist = 22 + Math.random() * 20;
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: 0.2,
        duration: 0.36,
        ease: 'power2.out',
        onComplete: () => dot.remove(),
      });
    }
  };

  const triggerArenaShake = () => {
    if (!arenaRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      arenaRef.current,
      { x: -5 },
      { x: 0, duration: 0.32, ease: 'elastic.out(1, 0.3)' }
    );
  };

  const startBugGame = () => {
    bugsRef.current = [];
    livesRef.current = 3;
    bugScoreRef.current = 0;
    squashedCountRef.current = 0;
    comboRef.current = 1;
    lastSquashTimeRef.current = 0;
    spawnAccumRef.current = 950;
    lastFrameRef.current = 0;
    setBugs([]);
    setPopups([]);
    setLives(3);
    setBugScore(0);
    setCombo(1);
    setBugState('playing');
    if (soundOn) playSynthTone(520, 0.08);
  };

  useEffect(() => {
    if (mode !== 'bug-squash' || bugState !== 'playing') return;

    let rafId = 0;

    const spawnBug = (width: number, height: number) => {
      const roll = Math.random();
      const score = squashedCountRef.current;
      let kind: BugKind = 'syntax';
      if (score >= 4 && roll > 0.72) kind = 'race';
      if (score >= 8 && roll > 0.88) kind = 'memory';

      const fromLeft = Math.random() > 0.5;
      const mult = 1 + Math.min(2.3, score * 0.05);
      const baseSpeed =
        kind === 'race'
          ? (110 + Math.random() * 45) * mult
          : kind === 'memory'
            ? (54 + Math.random() * 22) * mult
            : (68 + Math.random() * 38) * mult;

      const x = fromLeft ? -18 : width + 18;
      const y = 34 + Math.random() * Math.max(44, height - 68);
      const vy = (Math.random() - 0.5) * 44;
      const vx = fromLeft ? baseSpeed : -baseSpeed;

      bugsRef.current.push({
        id: nextBugId.current++,
        kind,
        x,
        y,
        vx,
        vy,
        angle: (Math.atan2(vy, vx) * 180) / Math.PI,
        hp: kind === 'memory' ? 2 : 1,
        maxHp: kind === 'memory' ? 2 : 1,
        points: kind === 'memory' ? 40 : kind === 'race' ? 25 : 10,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    };

    const tick = (now: number) => {
      const arena = arenaRef.current;
      if (!arena) return;

      if (!lastFrameRef.current) lastFrameRef.current = now;
      const dtMs = Math.min(48, now - lastFrameRef.current);
      const dtSec = dtMs / 1000;
      lastFrameRef.current = now;

      const width = arena.clientWidth;
      const height = arena.clientHeight;

      const spawnInterval = Math.max(420, 1180 - squashedCountRef.current * 28);
      spawnAccumRef.current += dtMs;
      if (spawnAccumRef.current >= spawnInterval && bugsRef.current.length < 10) {
        spawnAccumRef.current = 0;
        spawnBug(width, height);
      }

      let escapedCount = 0;
      const nextBugs: BugEntity[] = [];

      for (const bug of bugsRef.current) {
        const phase = bug.wobblePhase + dtSec * (bug.kind === 'race' ? 9 : 4);
        const wobbleVy = bug.kind === 'race' ? Math.sin(phase) * 95 : bug.vy;
        const nx = bug.x + bug.vx * dtSec;
        let ny = bug.y + wobbleVy * dtSec;
        let nvy = bug.vy;

        if (ny < 24) {
          ny = 24;
          nvy = Math.abs(nvy);
        } else if (ny > height - 24) {
          ny = height - 24;
          nvy = -Math.abs(nvy);
        }

        const escapedRight = bug.vx > 0 && nx > width + 24;
        const escapedLeft = bug.vx < 0 && nx < -24;

        if (escapedRight || escapedLeft) {
          escapedCount++;
        } else {
          nextBugs.push({
            ...bug,
            x: nx,
            y: ny,
            vy: nvy,
            wobblePhase: phase,
            angle: (Math.atan2(wobbleVy, bug.vx) * 180) / Math.PI,
          });
        }
      }

      bugsRef.current = nextBugs;
      setBugs(nextBugs);

      if (escapedCount > 0) {
        comboRef.current = 1;
        setCombo(1);
        const remaining = Math.max(0, livesRef.current - escapedCount);
        livesRef.current = remaining;
        setLives(remaining);
        triggerArenaShake();
        if (soundOn) playSynthTone(180, 0.14, 'sawtooth');
        if (remaining <= 0) {
          setBugState('gameover');
          return;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [mode, bugState, soundOn]);

  const squashBug = (bug: BugEntity) => {
    if (bugState !== 'playing') return;

    if (bug.hp > 1) {
      bugsRef.current = bugsRef.current.map((b) =>
        b.id === bug.id ? { ...b, hp: b.hp - 1 } : b
      );
      setBugs(bugsRef.current);
      if (soundOn) playSynthTone(380, 0.05);
      return;
    }

    bugsRef.current = bugsRef.current.filter((b) => b.id !== bug.id);
    setBugs(bugsRef.current);

    const now = performance.now();
    const nextCombo = now - lastSquashTimeRef.current < 1350 ? Math.min(5, comboRef.current + 1) : 1;
    lastSquashTimeRef.current = now;
    comboRef.current = nextCombo;
    setCombo(nextCombo);

    const earned = bug.points * nextCombo;
    squashedCountRef.current += 1;
    const nextScore = bugScoreRef.current + earned;
    bugScoreRef.current = nextScore;
    setBugScore(nextScore);

    if (nextScore > bestBugScore) {
      setBestBugScore(nextScore);
      saveScore(BEST_BUG_KEY, nextScore);
    }

    triggerBurst(bug.x, bug.y);
    if (soundOn) playSynthTone(540 + nextCombo * 80, 0.07);

    const popId = Date.now() + Math.random();
    const label = nextCombo > 1 ? `+${earned} · x${nextCombo}` : `+${earned}`;
    setPopups((prev) => [...prev, { id: popId, x: bug.x, y: bug.y, label }]);
    window.setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popId));
    }, 520);
  };

  // Seat Lock Blitz Loop
  const startSeatGame = () => {
    seatScoreRef.current = 0;
    setSeatScore(0);
    setSeatStreak(0);
    setTimeLeft(30);
    setSeats(createInitialSeats());
    setSeatState('playing');
    if (soundOn) playSynthTone(580, 0.08);
  };

  useEffect(() => {
    if (mode !== 'seat-blitz' || seatState !== 'playing') return;

    const countdownId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setSeatState('gameover');
          if (soundOn) playSynthTone(320, 0.16);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const demandId = window.setInterval(() => {
      const now = Date.now();
      setSeats((prev) => {
        const updated = prev.map((seat) => {
          if ((seat.state === 'hot' || seat.state === 'vip') && now > seat.expiresAt) {
            return { ...seat, state: 'idle' as SeatState, expiresAt: 0 };
          }
          return seat;
        });

        const idleIndices = updated
          .map((s, idx) => (s.state === 'idle' ? idx : -1))
          .filter((idx) => idx !== -1);

        if (idleIndices.length > 0) {
          const spawnCount = Math.min(idleIndices.length, Math.random() > 0.45 ? 2 : 1);
          for (let i = 0; i < spawnCount; i++) {
            const pickPos = Math.floor(Math.random() * idleIndices.length);
            const seatIdx = idleIndices.splice(pickPos, 1)[0];
            const isVip = Math.random() > 0.78;
            updated[seatIdx] = {
              ...updated[seatIdx],
              state: isVip ? 'vip' : 'hot',
              expiresAt: now + (isVip ? 1400 : 1850),
            };
          }
        }
        return updated;
      });
    }, 480);

    return () => {
      window.clearInterval(countdownId);
      window.clearInterval(demandId);
    };
  }, [mode, seatState, soundOn]);

  const handleSeatClick = (seat: SeatTile, e: React.MouseEvent<HTMLButtonElement>) => {
    if (seatState !== 'playing') return;

    if (!prefersReducedMotion()) {
      gsap.fromTo(e.currentTarget, { scale: 0.88 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
    }

    if (seat.state === 'hot' || seat.state === 'vip') {
      const base = seat.state === 'vip' ? 40 : 15;
      const nextStreak = seatStreak + 1;
      const bonus = nextStreak >= 4 ? 10 : 0;
      const nextScore = seatScoreRef.current + base + bonus;
      seatScoreRef.current = nextScore;
      setSeatScore(nextScore);
      setSeatStreak(nextStreak);

      if (nextScore > bestSeatScore) {
        setBestSeatScore(nextScore);
        saveScore(BEST_SEAT_KEY, nextScore);
      }

      if (soundOn) playSynthTone(seat.state === 'vip' ? 760 : 600, 0.06);

      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, state: 'sold', expiresAt: 0 } : s))
      );

      // Re-open sold seat after a short cooldown so 30s round stays lively
      window.setTimeout(() => {
        setSeats((prev) =>
          prev.map((s) => (s.id === seat.id && s.state === 'sold' ? { ...s, state: 'idle' } : s))
        );
      }, 2400);
    } else {
      setSeatStreak(0);
      const nextScore = Math.max(0, seatScoreRef.current - 5);
      seatScoreRef.current = nextScore;
      setSeatScore(nextScore);
      if (soundOn) playSynthTone(200, 0.09, 'sawtooth');
    }
  };

  return (
    <section id="bug-squash" className="py-16 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
            Interactive Arcade
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {mode === 'bug-squash' ? 'Bug Squash' : 'Seat Lock Blitz'}
          </h2>
          <p className="mt-1.5 text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'bug-squash'
              ? 'Squash syntax bugs, zig-zagging race conditions, and 2-hit memory leaks before they escape.'
              : 'Inspired by vtickets WebSockets — lock high-demand & VIP seats in 30s before rival traffic claims them.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Game Switcher */}
          <div
            role="tablist"
            aria-label="Choose mini-game"
            className="inline-flex items-center gap-1 p-1 rounded-lg theme-transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'bug-squash'}
              onClick={() => setMode('bug-squash')}
              className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
              style={{
                backgroundColor: mode === 'bug-squash' ? 'var(--accent)' : 'transparent',
                color: mode === 'bug-squash' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              }}
            >
              Bug Squash
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'seat-blitz'}
              onClick={() => setMode('seat-blitz')}
              className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
              style={{
                backgroundColor: mode === 'seat-blitz' ? 'var(--accent)' : 'transparent',
                color: mode === 'seat-blitz' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              }}
            >
              Seat Lock Blitz
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            aria-label={soundOn ? 'Mute game sound' : 'Enable game sound'}
            title={soundOn ? 'Sound on' : 'Sound muted'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md theme-transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            {soundOn ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* HUD Strip */}
      {mode === 'bug-squash' ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 text-sm" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Score</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {bugScore}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Combo</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--accent)' }}>
                x{combo}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Speed</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {speedMultiplier.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Best</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {bestBugScore}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Lives</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {lives} / 3
              </span>
            </div>
          </div>

          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            Syntax 10pt · Race 25pt · Memory Leak 40pt (2 hits)
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 text-sm" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Score</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {seatScore}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Streak</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--accent)' }}>
                {seatStreak}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Best</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {bestSeatScore}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Time</span>
              <span className="font-mono-tabular font-semibold text-base" style={{ color: timeLeft <= 7 && seatState === 'playing' ? 'var(--accent)' : 'var(--text-primary)' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            Click highlighted Demand (+15) & VIP (+40) seats
          </p>
        </div>
      )}

      {/* ARENA */}
      {mode === 'bug-squash' ? (
        <div
          ref={arenaRef}
          className="relative w-full h-[290px] sm:h-[330px] rounded-xl overflow-hidden select-none theme-transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div ref={burstLayerRef} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true" />

          {bugState === 'playing' &&
            bugs.map((bug) => {
              const scale = bug.kind === 'memory' ? 1.28 : bug.kind === 'race' ? 0.92 : 1;
              return (
                <button
                  key={bug.id}
                  type="button"
                  onClick={() => squashBug(bug)}
                  aria-label={`Squash ${bug.kind} bug`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-2 z-10"
                  style={{
                    left: `${bug.x}px`,
                    top: `${bug.y}px`,
                    color: 'var(--accent)',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={bug.kind === 'memory' ? '2.2' : '1.9'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: `rotate(${bug.angle + 90}deg)` }}
                    aria-hidden="true"
                  >
                    <path d="M8 6l-2-3" />
                    <path d="M16 6l2-3" />
                    <ellipse
                      cx="12"
                      cy="13"
                      rx={bug.kind === 'memory' ? 5.2 : 4.3}
                      ry="6"
                      fill="currentColor"
                      fillOpacity={bug.hp > 1 ? '0.45' : '0.2'}
                    />
                    <path d="M12 7v12" />
                    <path d="M7.5 11H4" />
                    <path d="M7.5 14H4" />
                    <path d="M8 17l-3 2" />
                    <path d="M16.5 11H20" />
                    <path d="M16.5 14H20" />
                    <path d="M16 17l3 2" />
                  </svg>
                </button>
              );
            })}

          {popups.map((pop) => (
            <span
              key={pop.id}
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono-tabular text-xs font-bold z-20"
              style={{
                left: `${pop.x}px`,
                top: `${pop.y - 12}px`,
                color: 'var(--accent)',
              }}
            >
              {pop.label}
            </span>
          ))}

          {bugState !== 'playing' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20"
              style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)' }}
            >
              {bugState === 'idle' ? (
                <>
                  <p className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Ready to debug?
                  </p>
                  <p className="mt-1 text-xs sm:text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                    Chain fast squashes for up to 5x combo. Heavy memory leaks take 2 clicks.
                  </p>
                  <button
                    type="button"
                    onClick={startBugGame}
                    className="mt-4 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Start game
                  </button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Game over
                  </p>
                  <p className="mt-1 text-sm font-mono-tabular" style={{ color: 'var(--text-secondary)' }}>
                    Score: {bugScore} · Best: {bestBugScore}
                  </p>
                  <button
                    type="button"
                    onClick={startBugGame}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Play again</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative w-full min-h-[290px] sm:min-h-[330px] p-4 sm:p-6 rounded-xl overflow-hidden select-none flex flex-col justify-center theme-transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <div className="mb-3 flex items-center justify-between text-[11px] font-mono-tabular" style={{ color: 'var(--text-muted)' }}>
            <span>STAGE / FRONT ROW</span>
            <span>REAL-TIME DEMAND GRID</span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-2.5 max-w-xl mx-auto w-full">
            {seats.map((seat) => {
              const isHot = seat.state === 'hot';
              const isVip = seat.state === 'vip';
              const isSold = seat.state === 'sold';
              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={seatState !== 'playing'}
                  onClick={(e) => handleSeatClick(seat, e)}
                  className="h-10 sm:h-11 rounded-md font-mono-tabular text-xs font-medium flex items-center justify-center theme-transition"
                  style={{
                    backgroundColor: isVip
                      ? 'var(--accent)'
                      : isHot
                        ? 'var(--accent-soft)'
                        : isSold
                          ? 'var(--bg-subtle)'
                          : 'var(--bg-canvas)',
                    color: isVip
                      ? 'var(--accent-contrast)'
                      : isHot
                        ? 'var(--accent)'
                        : isSold
                          ? 'var(--text-muted)'
                          : 'var(--text-secondary)',
                    border: isVip || isHot ? '1.5px solid var(--accent)' : '1px solid var(--border-hairline)',
                    opacity: isSold ? 0.55 : 1,
                  }}
                >
                  {isVip ? 'VIP' : isSold ? 'LOCK' : seat.label}
                </button>
              );
            })}
          </div>

          {seatState !== 'playing' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20"
              style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)' }}
            >
              {seatState === 'idle' ? (
                <>
                  <p className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Seat Lock Blitz
                  </p>
                  <p className="mt-1 text-xs sm:text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                    Lock highlighted seats as traffic surges across the 30-seat floor. Avoid empty seats (-5).
                  </p>
                  <button
                    type="button"
                    onClick={startSeatGame}
                    className="mt-4 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Start 30s round
                  </button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Round complete
                  </p>
                  <p className="mt-1 text-sm font-mono-tabular" style={{ color: 'var(--text-secondary)' }}>
                    Score: {seatScore} · Best: {bestSeatScore}
                  </p>
                  <button
                    type="button"
                    onClick={startSeatGame}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Play again</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
