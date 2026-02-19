import { Users, FileText, Code2, Globe } from 'lucide-react';
import { AnimatedCounter } from './MotionWrappers';
import type { Translations } from '../i18n/translations';

interface StatsBarProps {
  t: Translations['stats'];
}

export function StatsBar({ t }: StatsBarProps) {
  const stats = [
    { icon: Users, value: 500, suffix: '+', label: t.developers, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { icon: FileText, value: 2000, suffix: '+', label: t.posts, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Code2, value: 50, suffix: '+', label: t.technologies, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Globe, value: 30, suffix: '+', label: t.countries, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <section className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-200 dark:divide-zinc-800">
          {stats.map(({ icon: Icon, value, suffix, label, color, bg }) => (
            <div key={label} className="flex items-center justify-center gap-3 px-6 py-8 md:py-10">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <div className={`text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100`}>
                  <AnimatedCounter target={value} suffix={suffix} duration={2} />
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
