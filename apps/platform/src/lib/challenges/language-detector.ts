/**
 * Auto-detect the programming language of a code snippet using heuristic
 * pattern matching. Returns the most likely language identifier.
 * Defaults to "javascript" when no strong signal is found.
 */
export function detectLanguage(code: string): string {
  interface Pattern {
    language: string;
    score: number;
    regex: RegExp;
  }

  const patterns: Pattern[] = [
    // TypeScript — must come before JavaScript
    {
      language: "typescript",
      score: 10,
      regex:
        /\b(interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|void|any|never)\b|<\w+>|\bas\s+\w+\b)/m,
    },
    // Python
    {
      language: "python",
      score: 10,
      regex: /\b(def\s+\w+\s*\(|import\s+\w+|print\s*\(|class\s+\w+\s*:|if\s+__name__\s*==)/m,
    },
    // Java
    {
      language: "java",
      score: 10,
      regex: /\b(public\s+class\b|public\s+static\s+void\s+main|System\.(out|err)\.|import\s+java\.)/m,
    },
    // Go
    {
      language: "go",
      score: 10,
      regex: /\b(package\s+\w+|func\s+\w+\s*\(|fmt\.(Print|Scan|Sprint|Fprintf)|:=\s)/m,
    },
    // C++
    {
      language: "cpp",
      score: 10,
      regex: /(#include\s*<\w+>|using\s+namespace\s+std\s*;|std::|cout\s*<<|cin\s*>>|int\s+main\s*\(\s*(void)?\s*\))/m,
    },
    // C#
    {
      language: "csharp",
      score: 10,
      regex: /\b(using\s+System\s*;|Console\.(Write|Read)|namespace\s+\w+\s*\{|class\s+\w+\s*:\s*\w+)/m,
    },
    // Rust
    {
      language: "rust",
      score: 10,
      regex: /\b(fn\s+main\s*\(\s*\)|let\s+mut\s+|println!\s*\(|use\s+std::)/m,
    },
    // Ruby
    {
      language: "ruby",
      score: 10,
      regex: /\b(puts\s+|require\s+['"]\w+['"]|def\s+\w+(\s*\n|\s*\()|\.each\s+(do|\{)|end\s*$)/m,
    },
    // PHP
    {
      language: "php",
      score: 10,
      regex: /(<\?php|\$\w+\s*=|echo\s+|function\s+\w+\s*\(.*\)\s*\{)/m,
    },
    // Kotlin
    {
      language: "kotlin",
      score: 10,
      regex: /\b(fun\s+main\s*\(|println\s*\(|val\s+\w+\s*:|var\s+\w+\s*:)/m,
    },
    // Swift
    {
      language: "swift",
      score: 10,
      regex: /\b(import\s+Foundation|func\s+\w+|guard\s+let\s+|let\s+\w+\s*=|var\s+\w+\s*:)/m,
    },
    // JavaScript (lowest priority — many patterns overlap)
    {
      language: "javascript",
      score: 5,
      regex: /\b(const\s+\w+|let\s+\w+|var\s+\w+|function\s+\w+|=>\s*\{|console\.(log|error))/m,
    },
  ];

  let bestMatch = "javascript";
  let bestScore = 0;

  for (const { language, score, regex } of patterns) {
    if (regex.test(code) && score > bestScore) {
      bestMatch = language;
      bestScore = score;
    }
  }

  return bestMatch;
}
