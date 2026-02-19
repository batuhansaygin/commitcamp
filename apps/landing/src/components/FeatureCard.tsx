import { motion } from 'framer-motion';
import {
  Code2, FileText, Rocket, Trophy, Bell, Search,
  type LucideIcon,
} from 'lucide-react';
import type { Translations } from '../i18n/translations';

const ICONS: Record<string, LucideIcon> = {
  Code2, FileText, Rocket, Trophy, Bell, Search,
};

const FEATURE_CONFIG = [
  { key: 'codeSharing', icon: 'Code2', gradient: 'from-cyan-500 to-blue-500', glow: 'hover:shadow-cyan-500/20' },
  { key: 'blog', icon: 'FileText', gradient: 'from-purple-500 to-violet-500', glow: 'hover:shadow-purple-500/20' },
  { key: 'showcase', icon: 'Rocket', gradient: 'from-orange-500 to-pink-500', glow: 'hover:shadow-orange-500/20' },
  { key: 'xp', icon: 'Trophy', gradient: 'from-yellow-500 to-amber-500', glow: 'hover:shadow-yellow-500/20' },
  { key: 'notifications', icon: 'Bell', gradient: 'from-emerald-500 to-teal-500', glow: 'hover:shadow-emerald-500/20' },
  { key: 'search', icon: 'Search', gradient: 'from-blue-500 to-indigo-500', glow: 'hover:shadow-blue-500/20' },
] as const;

interface FeaturesGridProps {
  t: Translations['features'];
}

export function FeaturesGrid({ t }: FeaturesGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {FEATURE_CONFIG.map(({ key, icon, gradient, glow }, i) => {
        const Icon = ICONS[icon];
        const feature = t[key as keyof typeof t] as { title: string; description: string };
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            className={[
              'group relative rounded-2xl border border-zinc-200 dark:border-zinc-800',
              'bg-white dark:bg-zinc-900/50 p-6',
              'transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700',
              'hover:shadow-xl hover:-translate-y-1',
              glow,
            ].join(' ')}
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
            >
              <Icon size={20} />
            </div>
            <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
