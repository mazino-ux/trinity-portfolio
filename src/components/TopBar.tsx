import { useEffect, useRef, useState } from 'react';
import { Check, Menu, Moon, Palette, Sun, X } from 'lucide-react';
import { type ColorTheme, THEME_SWATCHES, type ThemeMode } from '../hooks/useTheme';

interface TopBarProps {
  colorTheme: ColorTheme;
  onSelectColor: (theme: ColorTheme) => void;
  mode: ThemeMode;
  onToggleMode: () => void;
  onNavigateSection: (sectionId: string) => void;
}

const NAV_LINKS = [
  { label: 'About', target: 'about' },
  { label: 'Work', target: 'work' },
  { label: 'Ask', target: 'ask' },
  { label: 'Contact', target: 'contact' },
];

export function TopBar({
  colorTheme,
  onSelectColor,
  mode,
  onToggleMode,
  onNavigateSection,
}: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!paletteOpen && !mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [paletteOpen, mobileMenuOpen]);

  const handleLinkClick = (target: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(target);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full theme-transition"
      style={{
        backgroundColor: scrolled || mobileMenuOpen ? 'var(--bg-canvas)' : 'transparent',
        borderBottom: scrolled || mobileMenuOpen ? '1px solid var(--border-hairline)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('top');
          }}
          className="font-display text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-primary)' }}
        >
          Trinity Ogwezi
        </a>

        {/* Zone 2: Desktop 4 single-line nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.target);
              }}
              className="text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-current transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Theme palette button + Mobile hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <div ref={popoverRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setPaletteOpen((open) => !open);
                setMobileMenuOpen(false);
              }}
              aria-expanded={paletteOpen}
              aria-label="Theme palette"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 theme-transition"
              style={{
                backgroundColor: paletteOpen ? 'var(--accent)' : 'var(--bg-surface)',
                color: paletteOpen ? 'var(--accent-contrast)' : 'var(--text-primary)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <Palette className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Theme</span>
            </button>

            {paletteOpen && (
              <div
                role="dialog"
                aria-label="Choose theme colour and mode"
                className="absolute right-0 mt-2 w-60 p-3.5 rounded-lg theme-transition z-50"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Palette
                  </span>
                  <button
                    type="button"
                    onClick={onToggleMode}
                    aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded theme-transition"
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    {mode === 'light' ? (
                      <>
                        <Moon className="w-3 h-3" aria-hidden="true" />
                        <span>Dark</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3 h-3" aria-hidden="true" />
                        <span>Light</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2" role="radiogroup" aria-label="Colour swatches">
                  {THEME_SWATCHES.map((swatch) => {
                    const selected = colorTheme === swatch.id;
                    const swatchHex = mode === 'dark' ? swatch.darkColor : swatch.lightColor;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={swatch.label}
                        title={swatch.label}
                        onClick={() => onSelectColor(swatch.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105"
                        style={{
                          backgroundColor: swatchHex,
                          outline: selected ? '2px solid var(--text-primary)' : 'none',
                          outlineOffset: '2px',
                        }}
                      >
                        {selected && (
                          <Check
                            className="w-3.5 h-3.5"
                            style={{ color: mode === 'dark' ? '#09090b' : '#ffffff' }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {THEME_SWATCHES.find((s) => s.id === colorTheme)?.label} · {mode === 'light' ? 'Light' : 'Dark'}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setPaletteOpen(false);
            }}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-md theme-transition"
            style={{
              backgroundColor: mobileMenuOpen ? 'var(--accent)' : 'var(--bg-surface)',
              color: mobileMenuOpen ? 'var(--accent-contrast)' : 'var(--text-primary)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden px-4 pb-4 pt-1 flex flex-col divide-y theme-transition"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderTop: '1px solid var(--border-hairline)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.target);
              }}
              className="py-3 text-sm font-medium flex items-center justify-between min-h-[44px]"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-hairline)' }}
            >
              <span>{link.label}</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }} aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
