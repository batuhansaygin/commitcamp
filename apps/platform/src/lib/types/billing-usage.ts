/** Usage tracking tool keys (must match `usage_tracking.tool` values). */
export type ToolType =
  | "code_review"
  | "readme_gen"
  | "commit_gen"
  | "code_convert"
  | "interview";

/** Ordered list for dashboards and limits (matches `AI_TOOLS_NAV`). */
export const AI_TOOLS_IN_ORDER: ToolType[] = [
  "code_review",
  "readme_gen",
  "commit_gen",
  "code_convert",
  "interview",
];

export interface TodayAiUsageRow {
  tool: ToolType;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}
