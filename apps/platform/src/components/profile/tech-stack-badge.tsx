import { cn } from "@/lib/utils";

const TECH_COLORS: Record<string, { bg: string; text: string }> = {
  react: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  "next.js": { bg: "bg-white/10", text: "text-white" },
  nextjs: { bg: "bg-white/10", text: "text-white" },
  typescript: { bg: "bg-blue-500/15", text: "text-blue-400" },
  javascript: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  python: { bg: "bg-blue-600/15", text: "text-blue-400" },
  "node.js": { bg: "bg-green-500/15", text: "text-green-400" },
  nodejs: { bg: "bg-green-500/15", text: "text-green-400" },
  go: { bg: "bg-cyan-600/15", text: "text-cyan-400" },
  rust: { bg: "bg-orange-500/15", text: "text-orange-400" },
  java: { bg: "bg-red-500/15", text: "text-red-400" },
  "c#": { bg: "bg-purple-500/15", text: "text-purple-400" },
  flutter: { bg: "bg-blue-400/15", text: "text-blue-300" },
  docker: { bg: "bg-blue-500/15", text: "text-blue-400" },
  aws: { bg: "bg-orange-500/15", text: "text-orange-400" },
  postgresql: { bg: "bg-blue-600/15", text: "text-blue-400" },
  postgres: { bg: "bg-blue-600/15", text: "text-blue-400" },
  mongodb: { bg: "bg-green-500/15", text: "text-green-400" },
  redis: { bg: "bg-red-500/15", text: "text-red-400" },
  graphql: { bg: "bg-pink-500/15", text: "text-pink-400" },
  tailwindcss: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  tailwind: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  "vue.js": { bg: "bg-green-400/15", text: "text-green-400" },
  vue: { bg: "bg-green-400/15", text: "text-green-400" },
  angular: { bg: "bg-red-600/15", text: "text-red-400" },
  swift: { bg: "bg-orange-500/15", text: "text-orange-400" },
  kotlin: { bg: "bg-purple-500/15", text: "text-purple-400" },
  ruby: { bg: "bg-red-500/15", text: "text-red-400" },
  php: { bg: "bg-purple-400/15", text: "text-purple-300" },
  django: { bg: "bg-green-700/15", text: "text-green-400" },
  fastapi: { bg: "bg-green-500/15", text: "text-green-400" },
  express: { bg: "bg-gray-400/15", text: "text-gray-300" },
  spring: { bg: "bg-green-500/15", text: "text-green-400" },
  svelte: { bg: "bg-orange-500/15", text: "text-orange-400" },
  linux: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  git: { bg: "bg-orange-600/15", text: "text-orange-400" },
  kubernetes: { bg: "bg-blue-500/15", text: "text-blue-400" },
  k8s: { bg: "bg-blue-500/15", text: "text-blue-400" },
};

const DEFAULT_COLORS = { bg: "bg-muted", text: "text-muted-foreground" };

interface TechStackBadgeProps {
  tech: string;
  className?: string;
}

export function TechStackBadge({ tech, className }: TechStackBadgeProps) {
  const key = tech.toLowerCase();
  const colors = TECH_COLORS[key] ?? DEFAULT_COLORS;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {tech}
    </span>
  );
}
