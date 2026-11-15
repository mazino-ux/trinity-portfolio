import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowUpRight, Check, Copy, Mail } from 'lucide-react';
import { AccessPass } from './components/AccessPass';
import { AskTrinity } from './components/AskTrinity';
import { BubbleCursor } from './components/BubbleCursor';
import { BugSquashGame } from './components/BugSquashGame';
import { ProjectDetail } from './components/ProjectDetail';
import { Reveal } from './components/Reveal';
import { TopBar } from './components/TopBar';
import {
  ABOUT_STATS,
  BUILD_STEPS,
  MARQUEE_TOOLS,
  PORTFOLIO_PROFILE,
  PROJECTS,
  STACK_GROUPS,
  type ProjectCategory,
} from './data/portfolio';
import { useTheme } from './hooks/useTheme';
import { gsap, prefersReducedMotion } from './lib/gsapSetup';

type FilterTab = 'All' | ProjectCategory;

const FILTER_TABS: FilterTab[] = ['All', 'Products', 'Contract', 'Experiments'];

function getProjectSlugFromHash(hash: string): string | null {
  const match = hash.match(/^#project\/([a-z0-9-]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

export default function App() {
  const { colorTheme, setColorTheme, mode, toggleMode } = useTheme();

  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    getProjectSlugFromHash(window.location.hash)
  );
  const [filter, setFilter] = useState<FilterTab>('All');
  const [activeStep, setActiveStep] = useState(0);
  const [stepperPaused, setStepperPaused] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const statsGridRef = useRef<HTMLDListElement>(null);
  const projectListRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);
  const stepDetailRef = useRef<HTMLDivElement>(null);

  // Sync hash changes for project detail routes
  useEffect(() => {
    const onHashChange = () => {
      const slug = getProjectSlugFromHash(window.location.hash);
      setActiveSlug(slug);
      if (slug) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // GSAP Hero Entrance + Stats ScrollTrigger + Infinite Smooth Marquee
  useEffect(() => {
    if (activeSlug || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.from('[data-hero-anim]', {
          y: 24,
          opacity: 0,
          duration: 0.72,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      }

      if (statsGridRef.current) {
        gsap.from('[data-stat-item]', {
          y: 16,
          opacity: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: statsGridRef.current,
            start: 'top 86%',
            once: true,
          },
        });
      }

      if (marqueeTrackRef.current) {
        marqueeTweenRef.current = gsap.to(marqueeTrackRef.current, {
          xPercent: -50,
          duration: 28,
          ease: 'none',
          repeat: -1,
        });
      }
    });

    return () => {
      marqueeTweenRef.current = null;
      ctx.revert();
    };
  }, [activeSlug]);

  // GSAP stagger when project filter changes
  useEffect(() => {
    if (activeSlug || !projectListRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-project-row]', {
        y: 14,
        opacity: 0,
        duration: 0.42,
        stagger: 0.055,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, projectListRef.current);

    return () => ctx.revert();
  }, [filter, activeSlug]);

  // GSAP smooth transition on Build Stepper detail box
  useEffect(() => {
    if (activeSlug || !stepDetailRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      stepDetailRef.current,
      { y: 6, opacity: 0.4 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  }, [activeStep, activeSlug]);

  // Auto-advance "How I build" stepper unless paused or reduced motion
  useEffect(() => {
    if (activeSlug || stepperPaused) return;
    if (prefersReducedMotion()) return;

    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % BUILD_STEPS.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeSlug, stepperPaused]);

  const activeProject = useMemo(
    () => (activeSlug ? PROJECTS.find((p) => p.slug === activeSlug) ?? null : null),
    [activeSlug]
  );

  const filteredProjects = useMemo(
    () => (filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter]
  );

  const openProject = (slug: string) => {
    window.location.hash = `project/${slug}`;
  };

  const navigateToSection = (sectionId: string) => {
    const scrollToTarget = () => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (activeSlug) {
      window.history.pushState(null, '', sectionId === 'top' ? '#top' : `#${sectionId}`);
      setActiveSlug(null);
      window.requestAnimationFrame(() => {
        window.setTimeout(scrollToTarget, 40);
      });
    } else {
      scrollToTarget();
    }
  };

  const handleBackToProjects = () => {
    navigateToSection('work');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      window.location.href = `mailto:${PORTFOLIO_PROFILE.email}`;
    }
  };

  const handleMarqueeHover = (paused: boolean) => {
    const tween = marqueeTweenRef.current;
    if (!tween) return;
    gsap.to(tween, {
      timeScale: paused ? 0 : 1,
      duration: 0.45,
      ease: 'power2.out',
    });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col theme-transition" style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      <BubbleCursor />

      <TopBar
        colorTheme={colorTheme}
        onSelectColor={setColorTheme}
        mode={mode}
        onToggleMode={toggleMode}
        onNavigateSection={navigateToSection}
      />

      {activeProject ? (
        <ProjectDetail
          project={activeProject}
          onBack={handleBackToProjects}
          onSelectProject={openProject}
          onJumpToAnchor={(anchorId) => navigateToSection(anchorId)}
        />
      ) : (
        <main className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 flex-1">
          {/* 1. HERO */}
          <section ref={heroRef} className="pt-8 pb-16 sm:pt-16 sm:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-12">
              <div className="lg:col-span-7">
                <p data-hero-anim className="text-xs sm:text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  Software Engineer · Lagos, Nigeria
                </p>
                <h1
                  data-hero-anim
                  className="mt-4 font-display text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06]"
                  style={{ color: 'var(--text-primary)', textWrap: 'balance' }}
                >
                  Full-stack engineering built for real-world scale.
                </h1>
                <p
                  data-hero-anim
                  className="mt-5 text-base sm:text-lg leading-relaxed max-w-[54ch]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  I build frontend interfaces, backend systems, and cross-platform integrations—from national e-invoicing infrastructure and consumer ticketing to cloud DevOps, DNS, and Cloudflare delivery.
                </p>

                <div data-hero-anim className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => navigateToSection('work')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    <span>Selected work</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToSection('bug-squash')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    <span>Play arcade</span>
                  </button>
                </div>
              </div>

              <div data-hero-anim className="lg:col-span-5">
                <AccessPass />
              </div>
            </div>
          </section>

          {/* 2. ABOUT */}
          <Reveal>
            <section id="about" className="py-14 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <div className="max-w-3xl">
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                  About
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Frontend, backend, integrations, and DevOps.
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {PORTFOLIO_PROFILE.aboutIntro}
                </p>
              </div>

              {/* Four inline stats (no boxes) */}
              <dl
                ref={statsGridRef}
                className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 pt-8"
                style={{ borderTop: '1px solid var(--border-hairline)' }}
              >
                {ABOUT_STATS.map((stat) => (
                  <div key={stat.label} data-stat-item>
                    <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </dt>
                    <dd className="mt-1.5 font-display text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </dd>
                    <dd className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {stat.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>

          {/* 3. SELECTED PROJECTS */}
          <Reveal>
            <section id="work" className="py-14 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                    Selected Work
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Selected projects
                  </h2>
                </div>

                {/* Filter tabs */}
                <div
                  role="tablist"
                  aria-label="Filter projects by category"
                  className="inline-flex items-center gap-1 p-1 rounded-lg self-start sm:self-auto max-w-full overflow-x-auto theme-transition"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  {FILTER_TABS.map((tab) => {
                    const active = filter === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setFilter(tab)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
                        style={{
                          backgroundColor: active ? 'var(--accent)' : 'transparent',
                          color: active ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                        }}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clean editorial rows with hairline dividers */}
              <div
                ref={projectListRef}
                className="divide-y"
                style={{
                  borderTop: '1px solid var(--border-hairline)',
                  borderBottom: '1px solid var(--border-hairline)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                {filteredProjects.map((project, idx) => (
                  <article
                    key={project.slug}
                    data-project-row
                    className="group py-6 sm:py-7"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <button
                      type="button"
                      onClick={() => openProject(project.slug)}
                      className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 focus-visible:outline-2 rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="font-mono-tabular">0{idx + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: 'var(--accent)' }} className="font-medium">
                            {project.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{project.year}</span>
                        </div>

                        <h3
                          className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight group-hover:underline underline-offset-4"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {project.title}
                        </h3>

                        <p className="mt-1.5 text-sm leading-relaxed max-w-[66ch]" style={{ color: 'var(--text-secondary)' }}>
                          {project.summary}
                        </p>

                        <p className="mt-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {project.stack.slice(0, 5).join(' · ')}
                        </p>
                      </div>

                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 self-start sm:self-center"
                        style={{ color: 'var(--accent)' }}
                      >
                        <span>View details</span>
                        <ArrowRight
                          className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          {/* 4. BUG SQUASH & SEAT LOCK BLITZ ARCADE */}
          <Reveal>
            <BugSquashGame />
          </Reveal>

          {/* 5. TOOLS I WORK WITH (GSAP MARQUEE + FULL STACK AT A GLANCE) */}
          <Reveal>
            <section className="py-14 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                    Stack
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Tools I work with
                  </h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Hover carousel to pause · Full stack below
                </p>
              </div>

              {/* Sliding Marquee Carousel */}
              <div
                onMouseEnter={() => handleMarqueeHover(true)}
                onMouseLeave={() => handleMarqueeHover(false)}
                className="overflow-hidden py-5"
                style={{
                  borderTop: '1px solid var(--border-hairline)',
                  borderBottom: '1px solid var(--border-hairline)',
                }}
              >
                <div ref={marqueeTrackRef} className="flex w-max items-center gap-10">
                  {[...MARQUEE_TOOLS, ...MARQUEE_TOOLS].map((tool, index) => (
                    <span
                      key={`${tool}-${index}`}
                      className="inline-flex items-center gap-10 font-display text-lg sm:text-2xl font-semibold tracking-tight whitespace-nowrap shrink-0"
                      style={{ color: index % 2 === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      <span>{tool}</span>
                      <span aria-hidden="true" className="text-xs" style={{ color: 'var(--accent)' }}>
                        /
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Full Stack At-a-Glance Directory */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {STACK_GROUPS.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-xs font-semibold tracking-tight mb-2.5" style={{ color: 'var(--accent)' }}>
                      {group.category}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {group.items.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* 6. HOW I BUILD (INTERACTIVE STEPPER) */}
          <Reveal>
            <section
              className="py-14 sm:py-20"
              style={{ borderTop: '1px solid var(--border-hairline)' }}
              onMouseEnter={() => setStepperPaused(true)}
              onMouseLeave={() => setStepperPaused(false)}
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                    Process
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    How I build
                  </h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Select any step to inspect
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {BUILD_STEPS.map((step, index) => {
                  const isActive = activeStep === index;
                  return (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => {
                        setActiveStep(index);
                        setStepperPaused(true);
                      }}
                      aria-current={isActive ? 'step' : undefined}
                      className="text-left p-5 rounded-lg flex flex-col justify-between theme-transition"
                      style={{
                        backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-contrast)' : 'var(--text-primary)',
                        border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-hairline)',
                      }}
                    >
                      <div>
                        <span
                          className="font-mono-tabular text-xs font-medium block"
                          style={{
                            color: isActive ? 'var(--accent-contrast)' : 'var(--accent)',
                            opacity: isActive ? 0.85 : 1,
                          }}
                        >
                          {step.number}
                        </span>
                        <h3 className="mt-2 font-display text-lg font-bold tracking-tight">
                          {step.title}
                        </h3>
                        <p
                          className="mt-2 text-xs sm:text-sm leading-relaxed"
                          style={{
                            color: isActive ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                            opacity: isActive ? 0.92 : 1,
                          }}
                        >
                          {step.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                ref={stepDetailRef}
                className="mt-5 px-5 py-4 rounded-lg text-sm leading-relaxed theme-transition"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="font-mono-tabular text-xs font-semibold mr-2" style={{ color: 'var(--accent)' }}>
                  {BUILD_STEPS[activeStep].number} · {BUILD_STEPS[activeStep].title}:
                </span>
                {BUILD_STEPS[activeStep].detail}
              </div>
            </section>
          </Reveal>

          {/* 7. ASK TRINITY (AI) */}
          <Reveal>
            <AskTrinity />
          </Reveal>

          {/* 8. CONTACT */}
          <Reveal>
            <section id="contact" className="py-14 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                    Contact
                  </p>
                  <h2
                    className="font-display text-2xl sm:text-4xl font-bold tracking-tight max-w-[24ch]"
                    style={{ color: 'var(--text-primary)', textWrap: 'balance' }}
                  >
                    Open to collaborations and contract work
                  </h2>
                  <p className="mt-3 text-sm sm:text-base max-w-[52ch]" style={{ color: 'var(--text-secondary)' }}>
                    Looking for full-stack delivery, technical leadership, or API & DevOps support? Let’s talk.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href={`mailto:${PORTFOLIO_PROFILE.email}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Contact Trinity</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>Copy email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium">
                <a
                  href={PORTFOLIO_PROFILE.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href={PORTFOLIO_PROFILE.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>Portfolio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href={PORTFOLIO_PROFILE.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </section>
          </Reveal>
        </main>
      )}

      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 py-8" style={{ borderTop: '1px solid var(--border-hairline)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>© 2026 Trinity Ogwezi</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 font-medium hover:underline underline-offset-4 whitespace-nowrap"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
