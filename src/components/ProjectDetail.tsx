import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { PROJECTS, type ProjectItem } from '../data/portfolio';
import { gsap, prefersReducedMotion } from '../lib/gsapSetup';

interface ProjectDetailProps {
  project: ProjectItem;
  onBack: () => void;
  onSelectProject: (slug: string) => void;
  onJumpToAnchor: (anchorId: string) => void;
}

export function ProjectDetail({
  project,
  onBack,
  onSelectProject,
  onJumpToAnchor,
}: ProjectDetailProps) {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndex = PROJECTS.findIndex((p) => p.slug === project.slug);
  const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-detail-anim]', {
        y: 18,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, el);

    return () => ctx.revert();
  }, [project.slug]);

  return (
    <main ref={containerRef} className="mx-auto max-w-[920px] px-4 sm:px-6 py-12 sm:py-20">
      <button
        type="button"
        onClick={onBack}
        data-detail-anim
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium pb-1 border-b border-transparent hover:border-current transition-colors whitespace-nowrap"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to projects</span>
      </button>

      <header data-detail-anim className="mt-8 pb-8" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--accent)' }}>
          <span>{project.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{project.year}</span>
        </div>

        <h1
          className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', textWrap: 'balance' }}
        >
          {project.title}
        </h1>

        <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-[65ch]" style={{ color: 'var(--text-secondary)' }}>
          {project.summary}
        </p>

        {(project.liveUrl || project.internalAnchor) && (
          <div className="mt-6">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <span>{project.liveLabel ?? 'Visit live project'}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onJumpToAnchor(project.internalAnchor!.replace('#', ''))}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <span>{project.liveLabel ?? 'Play experiment'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </header>

      <div className="mt-10 space-y-10">
        <section data-detail-anim>
          <h2 className="font-display text-sm font-semibold tracking-tight mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Overview
          </h2>
          <p className="text-sm sm:text-base leading-relaxed max-w-[68ch]" style={{ color: 'var(--text-primary)' }}>
            {project.overview}
          </p>
        </section>

        <section data-detail-anim>
          <h2 className="font-display text-sm font-semibold tracking-tight mb-2.5" style={{ color: 'var(--text-muted)' }}>
            My role
          </h2>
          <p className="text-sm sm:text-base leading-relaxed max-w-[68ch]" style={{ color: 'var(--text-primary)' }}>
            {project.role}
          </p>
        </section>

        <section data-detail-anim>
          <h2 className="font-display text-sm font-semibold tracking-tight mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Key outcomes
          </h2>
          <ul className="space-y-2.5 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {project.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="font-mono-tabular text-xs mt-1.5" style={{ color: 'var(--accent)' }} aria-hidden="true">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section data-detail-anim>
          <h2 className="font-display text-sm font-semibold tracking-tight mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Stack
          </h2>
          <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>
            {project.stack.join(' · ')}
          </p>
        </section>
      </div>

      <footer
        data-detail-anim
        className="mt-14 pt-8 flex flex-wrap items-center justify-between gap-4"
        style={{ borderTop: '1px solid var(--border-hairline)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to projects</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectProject(nextProject.slug)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap theme-transition"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          <span>Next project: {nextProject.title}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </footer>
    </main>
  );
}
