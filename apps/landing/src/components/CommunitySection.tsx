import { FadeInUp, StaggerContainer, StaggerItem } from './MotionWrappers';
import type { Translations } from '../i18n/translations';

const DEVELOPERS = [
  { name: 'Sarah Chen', username: 'sarahchen', level: 45, tier: 'Diamond', bio: 'Full-stack dev passionate about React and clean architecture.', tech: ['React', 'Next.js', 'Python'], grad: 'from-cyan-400 to-blue-500', rotate: '-rotate-1' },
  { name: 'Marcus Johnson', username: 'marcusj', level: 38, tier: 'Platinum', bio: 'Backend engineer. I write Go and think in distributed systems.', tech: ['Go', 'Docker', 'PostgreSQL'], grad: 'from-purple-500 to-violet-600', rotate: 'rotate-1' },
  { name: 'Elena Rodriguez', username: 'elena_dev', level: 52, tier: 'Legendary', bio: 'DevOps & platform engineering. Cloud-native by heart.', tech: ['AWS', 'Kubernetes', 'Rust'], grad: 'from-violet-500 to-purple-600', rotate: '-rotate-1' },
  { name: 'Alex Kim', username: 'alexkim', level: 29, tier: 'Gold', bio: 'Mobile & cross-platform dev. Swift fan, TypeScript enthusiast.', tech: ['Swift', 'Flutter', 'TypeScript'], grad: 'from-orange-400 to-pink-500', rotate: 'rotate-2' },
  { name: 'Priya Patel', username: 'priyap', level: 33, tier: 'Platinum', bio: 'Building intelligent systems. ML engineer in practice.', tech: ['Python', 'TensorFlow', 'FastAPI'], grad: 'from-emerald-400 to-teal-500', rotate: '-rotate-2' },
  { name: 'Tom Weber', username: 'tomweber', level: 21, tier: 'Gold', bio: 'Frontend craftsman. I care deeply about UX and accessibility.', tech: ['Vue.js', 'Svelte', 'Tailwind'], grad: 'from-rose-400 to-pink-500', rotate: 'rotate-1' },
];

const TIER_STYLE: Record<string, { color: string; bg: string }> = {
  Bronze: { color: '#cd7f32', bg: '#cd7f3218' },
  Silver: { color: '#9ca3af', bg: '#9ca3af18' },
  Gold: { color: '#eab308', bg: '#eab30818' },
  Platinum: { color: '#06b6d4', bg: '#06b6d418' },
  Diamond: { color: '#a855f7', bg: '#a855f718' },
};

interface CommunitySectionProps {
  t: Translations['community'];
}

export function CommunitySection({ t }: CommunitySectionProps) {
  return (
    <section id="community" className="py-24 md:py-32 bg-zinc-50 dark:bg-zinc-900/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <FadeInUp className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl lg:text-5xl">
            {t.title}
          </h2>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400 md:text-lg max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </FadeInUp>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
          {DEVELOPERS.map((dev) => {
            const tierStyle = TIER_STYLE[dev.tier];
            return (
              <StaggerItem key={dev.username}>
                <div
                  className={[
                    'group rounded-2xl border border-zinc-200 dark:border-zinc-800',
                    'bg-white dark:bg-zinc-900/50 p-5',
                    'transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700',
                    'hover:shadow-lg hover:-translate-y-1',
                    dev.rotate,
                    'hover:rotate-0',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`h-11 w-11 shrink-0 rounded-full bg-gradient-to-br ${dev.grad} flex items-center justify-center text-base text-white font-bold shadow-md`}
                    >
                      {dev.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {dev.name}
                        </span>
                        {dev.tier === 'Legendary' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400 text-white font-semibold">
                            Lvl {dev.level}
                          </span>
                        ) : (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold"
                            style={{
                              color: tierStyle?.color,
                              borderColor: `${tierStyle?.color}44`,
                              backgroundColor: tierStyle?.bg,
                            }}
                          >
                            Lvl {dev.level}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">@{dev.username}</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                    {dev.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {dev.tech.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-500 dark:text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
