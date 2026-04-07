export const interviewCategories = [
  "algorithms",
  "system-design",
  "frontend",
  "backend",
  "database",
] as const;

export type InterviewCategory = (typeof interviewCategories)[number];

export const CATEGORY_PROMPT: Record<InterviewCategory, string> = {
  algorithms: "Algorithms and data structures",
  "system-design": "System design and scalability",
  frontend: "Frontend engineering (UI, performance, accessibility)",
  backend: "Backend engineering (APIs, services, reliability)",
  database: "Databases, SQL, and data modeling",
};

export const CATEGORY_LABELS: Record<InterviewCategory, string> = {
  algorithms: "Algorithms & data structures",
  "system-design": "System design",
  frontend: "Frontend",
  backend: "Backend",
  database: "Database & SQL",
};
