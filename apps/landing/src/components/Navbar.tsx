import { useState, useEffect } from 'react';
import { Menu, X, GitCommit, Globe } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Translations, Lang } from '../i18n/translations';

interface NavbarProps {
  t: Translations['nav'];
  lang: Lang;
  platformUrl: string;
}

const NAV_LINKS = [
  { labelKey: 'features' as const, href: '#features' },
  { labelKey: 'community' as const, href: '#community' },
  { labelKey: 'openSource' as const, href: '#leaderboard' },
];

export function Navbar({ t, lang, platformUrl }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const alternateHref = lang === 'en' ? '/tr' : '/';

  const navClasses = [
    'fixed top-0 z-50 w-full transition-all duration-300',
    scrolled
      ? 'bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xl shadow-sm'
      : 'bg-transparent',
  ].join(' ');

  return (
    <header className={navClasses}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <a href={lang === 'en' ? '/' : '/tr'} className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/20 transition-transform group-hover:scale-105">
            <GitCommit size={16} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">CommitCamp</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ labelKey, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {t[labelKey]}
            </a>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-1 md:flex">
          <a
            href={alternateHref}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold"
            title="Switch language"
          >
            {lang === 'en' ? 'TR' : 'EN'}
          </a>
          <ThemeToggle />
          <a
            href={`${platformUrl}/login`}
            className="ml-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t.signIn}
          </a>
          <a
            href={`${platformUrl}/signup`}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
          >
            {t.getStarted}
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ labelKey, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-base font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 py-1"
            >
              {t[labelKey]}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <a
              href={alternateHref}
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <Globe size={14} />
              {lang === 'en' ? 'Türkçe' : 'English'}
            </a>
            <a
              href={`${platformUrl}/login`}
              className="block text-center py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t.signIn}
            </a>
            <a
              href={`${platformUrl}/signup`}
              className="block text-center py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold"
            >
              {t.getStarted}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
