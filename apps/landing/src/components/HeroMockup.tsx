import { motion } from 'framer-motion';
import { Search, Bell, GitCommit } from 'lucide-react';

function AppMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 blur-3xl rounded-3xl pointer-events-none" />
      {/* Browser frame */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3 rounded-full bg-zinc-800 px-3 py-1 text-center">
            <span className="text-[10px] text-zinc-400">app.commitcamp.com/feed</span>
          </div>
          <div className="w-16" />
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <GitCommit size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-zinc-100">CommitCamp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1">
              <Search size={10} className="text-zinc-500" />
              <span className="text-[9px] text-zinc-500">Search... ⌘K</span>
            </div>
            <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center">
              <Bell size={10} className="text-zinc-400" />
            </div>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
              D
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="bg-zinc-950 p-3 space-y-2.5">
          {/* Post 1 */}
          <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-semibold uppercase tracking-wide">
                discussion
              </span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-200 mb-1 leading-snug">
              Building a Full-Stack App with Next.js 15 &amp; Supabase
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[7px] text-white font-bold">
                  A
                </div>
                <span className="text-[9px] text-zinc-500">@alexdev</span>
                <span className="text-[8px] px-1 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                  Lvl 24
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                <span>❤️ 42</span>
                <span>💬 18</span>
              </div>
            </div>
          </div>

          {/* Post 2 */}
          <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-semibold uppercase tracking-wide">
                snippet
              </span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-200 mb-1">
              useDebounce — TypeScript React Hook
            </p>
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-2 font-mono text-[9px] leading-relaxed mb-2">
              <span className="text-purple-400">function </span>
              <span className="text-blue-300">useDebounce</span>
              <span className="text-zinc-400">&lt;T&gt;</span>
              <span className="text-zinc-300">(value: T, delay: </span>
              <span className="text-orange-300">number</span>
              <span className="text-zinc-300">): T</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[7px] text-white font-bold">
                  J
                </div>
                <span className="text-[9px] text-zinc-500">@janesmith</span>
                <span className="text-[8px] px-1 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">
                  Lvl 38
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                <span>❤️ 128</span>
                <span>💬 24</span>
              </div>
            </div>
          </div>

          {/* Post 3 */}
          <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 font-semibold uppercase tracking-wide">
                showcase
              </span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-200 mb-1">
              My Developer Portfolio — Built with Next.js &amp; Tailwind
            </p>
            <div className="flex items-center gap-1 mb-1">
              {['Next.js', 'TypeScript', 'Tailwind'].map((tag) => (
                <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <AppMockup />
      </motion.div>
    </motion.div>
  );
}
