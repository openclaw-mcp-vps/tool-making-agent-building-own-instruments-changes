import { NodeVM } from "vm2";

interface SandboxResult {
  output: unknown;
  logs: string[];
  durationMs: number;
}

const MAX_EXECUTION_MS = 4_000;

const normalizeToolSource = (rawCode: string): string => {
  const code = rawCode.trim();

  if (!code) {
    throw new Error("Tool code cannot be empty.");
  }

  if (code.includes("module.exports")) {
    return code;
  }

  if (
    code.startsWith("(") ||
    code.startsWith("async (") ||
    code.startsWith("function") ||
    code.startsWith("async function") ||
    code.startsWith("input =>") ||
    code.startsWith("(input)")
  ) {
    return `module.exports = ${code};`;
  }

  return `
module.exports = async function(input) {
${code}
};
`;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown sandbox error");
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Execution exceeded ${timeoutMs}ms timeout.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const executeInSandbox = async (
  rawCode: string,
  input: unknown,
  timeoutMs = MAX_EXECUTION_MS
): Promise<SandboxResult> => {
  const logs: string[] = [];
  const startedAt = performance.now();

  try {
    const vm = new NodeVM({
      console: "redirect",
      eval: false,
      wasm: false,
      require: {
        external: false,
        builtin: []
      },
      sandbox: {
        Date,
        Math,
        JSON
      }
    });

    vm.on("console.log", (...args: unknown[]) => {
      logs.push(args.map((arg) => formatForLog(arg)).join(" "));
    });

    vm.on("console.error", (...args: unknown[]) => {
      logs.push(`[error] ${args.map((arg) => formatForLog(arg)).join(" ")}`);
    });

    const source = normalizeToolSource(rawCode);
    const exported = vm.run(source, "tool.cjs");

    if (typeof exported !== "function") {
      throw new Error("Tool must export a function.");
    }

    const output = await withTimeout(Promise.resolve(exported(input)), timeoutMs);

    return {
      output,
      logs,
      durationMs: Math.round(performance.now() - startedAt)
    };
  } catch (error) {
    throw toError(error);
  }
};

const formatForLog = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
