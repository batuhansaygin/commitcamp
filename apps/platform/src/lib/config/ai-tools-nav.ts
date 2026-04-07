import type { ToolType } from "@/lib/types/billing-usage";

/** Single source for AI tool routes, usage keys, and sidebar presentation. */
export const AI_TOOLS_NAV: ReadonlyArray<{
  href: string;
  tool: ToolType;
  titleKey: string;
  iconGlyph: string;
  badge?: "popular" | "new";
}> = [
  {
    href: "/tools/code-review",
    tool: "code_review",
    titleKey: "codeReview",
    iconGlyph: "AI",
    badge: "popular",
  },
  {
    href: "/tools/readme-generator",
    tool: "readme_gen",
    titleKey: "readmeGenerator",
    iconGlyph: "MD",
  },
  {
    href: "/tools/commit-generator",
    tool: "commit_gen",
    titleKey: "commitGenerator",
    iconGlyph: "PR",
  },
  {
    href: "/tools/code-converter",
    tool: "code_convert",
    titleKey: "codeConverter",
    iconGlyph: "↔",
  },
  {
    href: "/tools/interview-prep",
    tool: "interview",
    titleKey: "interviewPrep",
    iconGlyph: "Q?",
    badge: "new",
  },
];

export type AiToolsNavItem = (typeof AI_TOOLS_NAV)[number];
