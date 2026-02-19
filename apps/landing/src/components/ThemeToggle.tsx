import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('cc-theme');
    if (stored) {
      setIsDark(stored === 'dark');
    } else {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('cc-theme', next ? 'dark' : 'light');
  };

  if (!mounted) {
    return (
      <button className={`h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 ${className}`} aria-label="Toggle theme">
        <Moon size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
