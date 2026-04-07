/**
 * Shared shapes for AI SaaS tools (aligned with product spec).
 * Server actions may return subsets or parsed variants; use Zod at boundaries.
 */

export type CodeReviewFocusArea = "bugs" | "performance" | "security" | "style" | "all";

export type CodeReviewGrade = "A" | "B" | "C" | "D" | "F";

export type IssueSeverity = "critical" | "major" | "minor" | "info";

export type IssueCategory = "bug" | "performance" | "security" | "style";

export interface CodeReviewIssue {
  severity: IssueSeverity;
  category: IssueCategory;
  line?: number;
  title: string;
  description: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  overallGrade: CodeReviewGrade;
  summary: string;
  issues: CodeReviewIssue[];
  strengths: string[];
  improvements: string[];
}

export interface ReadmeSection {
  title: string;
  content: string;
  order: number;
}

export interface ReadmeGeneratorResult {
  markdown: string;
  sections: ReadmeSection[];
  hasApiDocs: boolean;
  hasInstallation: boolean;
  hasUsageExamples: boolean;
}

export interface CommitGeneratorResult {
  conventional: string;
  simple: string;
  prDescription?: string;
  prTitle?: string;
}

export interface CodeConverterResult {
  code: string;
  notes: string[];
  warnings: string[];
  dependencies?: string[];
}

export type InterviewCategory =
  | "algorithms"
  | "system-design"
  | "frontend"
  | "backend"
  | "database";

export interface InterviewQuestionResult {
  id: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  hints?: string[];
}

export interface InterviewFeedbackResult {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  alternativeApproaches?: string[];
}
