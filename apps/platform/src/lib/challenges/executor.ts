/**
 * Piston Code Execution Engine
 * Uses the free, hosted Piston API: https://emkc.org/api/v2/piston
 * All execution happens server-side — never exposed to clients.
 */

const PISTON_API = "https://emkc.org/api/v2/piston";

/** Map CommitCamp language IDs to Piston runtime names + versions. */
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  go: { language: "go", version: "1.16.2" },
  cpp: { language: "c++", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  rust: { language: "rust", version: "1.68.2" },
  ruby: { language: "ruby", version: "3.0.1" },
  php: { language: "php", version: "8.2.3" },
  kotlin: { language: "kotlin", version: "1.8.20" },
  swift: { language: "swift", version: "5.3.3" },
};

interface PistonRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface PistonResponse {
  run?: PistonRunResult;
  compile?: { stderr: string };
  message?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TestCaseResult {
  passed: boolean;
  output: string;
  expected: string;
  time_ms: number;
  memory_mb: number;
  error?: string;
}

export interface AllTestsResult {
  results: Array<{ test_case_index: number } & TestCaseResult>;
  allPassed: boolean;
  totalTime: number;
  passedCount: number;
}

/**
 * Execute code with given stdin via the Piston API.
 * Throws if the language is unsupported or the API is unreachable.
 */
export async function executeCode(
  code: string,
  language: string,
  stdin = "",
  timeoutMs = 5000
): Promise<ExecutionResult> {
  const lang = LANGUAGE_MAP[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const response = await fetch(`${PISTON_API}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang.language,
      version: lang.version,
      files: [{ content: code }],
      stdin,
      run_timeout: timeoutMs,
      compile_timeout: 10_000,
    }),
    // Server-side fetch — use next.js revalidate: 0 to bypass cache
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Piston API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as PistonResponse;
  const run = data.run;

  if (!run) {
    const compileErr = data.compile?.stderr ?? data.message ?? "Unknown error";
    throw new Error(`Compilation error: ${compileErr}`);
  }

  return {
    stdout: run.stdout?.trim() ?? "",
    stderr: run.stderr?.trim() ?? "",
    exitCode: run.exitCode ?? 1,
  };
}

/**
 * Run a single test case: execute code, compare stdout to expected output.
 */
export async function runTestCase(
  code: string,
  language: string,
  testCase: { input: string; expected_output: string },
  timeoutMs: number
): Promise<TestCaseResult> {
  const start = Date.now();

  try {
    const result = await executeCode(code, language, testCase.input, timeoutMs);
    const elapsed = Date.now() - start;

    if (result.exitCode !== 0 && result.stderr) {
      return {
        passed: false,
        output: result.stderr.slice(0, 500),
        expected: testCase.expected_output,
        time_ms: elapsed,
        memory_mb: 0,
        error: result.stderr.slice(0, 500),
      };
    }

    const output = result.stdout.trim();
    const expected = testCase.expected_output.trim();
    const passed = output === expected;

    return { passed, output, expected, time_ms: elapsed, memory_mb: 0 };
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      output: "",
      expected: testCase.expected_output,
      time_ms: elapsed,
      memory_mb: 0,
      error: message.slice(0, 500),
    };
  }
}

/**
 * Run all test cases for a submission.
 * Returns results for ALL tests (does not stop on first failure).
 * Hidden test cases are included in execution but their input/expected
 * will be masked before returning to the client.
 */
export async function runAllTestCases(
  code: string,
  language: string,
  testCases: Array<{ input: string; expected_output: string; is_hidden: boolean }>,
  timeoutMs: number
): Promise<AllTestsResult> {
  const results: Array<{ test_case_index: number } & TestCaseResult> = [];
  let totalTime = 0;

  for (let i = 0; i < testCases.length; i++) {
    const result = await runTestCase(code, language, testCases[i], timeoutMs);
    results.push({ test_case_index: i, ...result });
    totalTime += result.time_ms;
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    results,
    allPassed: passedCount === testCases.length,
    totalTime,
    passedCount,
  };
}

/** Strip sensitive info from results before sending to client. */
export function sanitizeResultsForClient(
  results: Array<{ test_case_index: number } & TestCaseResult>,
  testCases: Array<{ is_hidden: boolean }>
): Array<{ test_case_index: number } & TestCaseResult> {
  return results.map((r, i) => {
    if (testCases[i]?.is_hidden) {
      return {
        ...r,
        output: r.passed ? "✓ (hidden)" : "✗ (hidden)",
        expected: "(hidden)",
      };
    }
    return r;
  });
}
