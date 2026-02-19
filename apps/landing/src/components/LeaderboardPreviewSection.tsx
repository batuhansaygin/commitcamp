import { FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from './MotionWrappers';
import type { Translations } from '../i18n/translations';

const FAKE_LEADERBOARD = [
  { rank: 1, name: 'Elena Rodriguez', username: 'elena_dev', level: 52, xp: 15420, grad: 'from-violet-500 to-purple-600', tier: 'Legendary' },
  { rank: 2, name: 'Marcus Chen', username: 'mchen', level: 48, xp: 14100, grad: 'from-cyan-500 to-blue-500', tier: 'Diamond' },
  { rank: 3, name: 'Sarah Kim', username: 'sarahkim', level: 45, xp: 13500, grad: 'from-pink-500 to-rose-500', tier: 'Diamond' },
  { rank: 4, name: 'Alex Thompson', username: 'athompson', level: 42, xp: 12200, grad: 'from-amber-500 to-orange-500', tier: 'Platinum' },
  { rank: 5, name: 'Priya Patel', username: 'priyap', level: 38, xp: 11800, grad: 'from-emerald-500 to-teal-500', tier: 'Platinum' },
];

const TIERS = [
  { label: 'Bronze', color: '#cd7f32' },
  { label: 'Silver', color: '#9ca3af' },
  { label: 'Gold', color: '#eab308' },
  { label: 'Platinum', color: '#06b6d4' },
  { label: 'Diamond', color: '#a855f7' },
  { label: 'Legendary', gradient: true },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500">
      {rank}
    </span>
  );
}

interface LeaderboardPreviewSectionProps {
  t: Translations['leaderboard'];
}

export function LeaderboardPreviewSection({ t }: LeaderboardPreviewSectionProps) {
  return (
    <section id="leaderboard" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Leaderboard */}
          <FadeInLeft>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 blur-2xl rounded-3xl pointer-events-none" />
              <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-5 py-3">
                  <span className="text-yellow-500">🏆</span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Global Leaderboard
                  </span>
                  <span className="ml-auto text-xs text-zinc-400">Top Developers</span>
                </div>

                <StaggerContainer className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {FAKE_LEADERBOARD.map((user) => (
                    <StaggerItem key={user.rank}>
                      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="w-8 flex items-center justify-center shrink-0">
                          <RankIcon rank={user.rank} />
                        </div>
                        <div
                          className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${user.grad} flex items-center justify-center text-sm text-white font-bold shadow-md`}
                        >
                          {user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-400">@{user.username}</p>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                          style={
                            user.tier === 'Legendary'
                              ? {}
                              : user.tier === 'Diamond'
                              ? { color: '#a855f7', borderColor: '#a855f730', backgroundColor: '#a855f718' }
                              : { color: '#06b6d4', borderColor: '#06b6d430', backgroundColor: '#06b6d418' }
                          }
                        >
                          {user.tier === 'Legendary' ? (
                            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent">
                              {user.tier}
                            </span>
                          ) : (
                            user.tier
                          )}
                        </span>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {user.xp.toLocaleString("en-US")}
                          </p>
                          <p className="text-[9px] text-zinc-400">XP</p>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-5 py-2.5 text-center text-xs text-zinc-400">
                  And thousands more...
                </div>
              </div>
            </div>
          </FadeInLeft>

          {/* Right: Text */}
          <FadeInRight delay={0.1}>
            <span className="text-sm font-semibold text-amber-500 uppercase tracking-widest">
              {t.label}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
              {t.title}
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.description}</p>

            {/* Tier badges */}
            <div className="mt-8">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                Tier System
              </p>
              <div className="flex flex-wrap gap-2">
                {TIERS.map(({ label, color, gradient }) => (
                  <span
                    key={label}
                    className={[
                      'text-xs px-2.5 py-1 rounded-full border font-semibold',
                      gradient ? 'bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400 text-white border-transparent' : '',
                    ].join(' ')}
                    style={
                      !gradient && color
                        ? {
                            color,
                            borderColor: `${color}44`,
                            backgroundColor: `${color}18`,
                          }
                        : undefined
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </FadeInRight>
        </div>
      </div>
    </section>
  );
}
