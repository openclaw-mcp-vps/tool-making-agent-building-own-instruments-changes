import vm from "node:vm";

export type SandboxExecutionResult = {
  result: unknown;
  logs: string[];
  elapsedMs: number;
};

export async function executeInSandbox(
  codeBody: string,
  input: unknown,
  timeoutMs = 2000,
): Promise<SandboxExecutionResult> {
  const logs: string[] = [];
  const startedAt = Date.now();

  const sandboxConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(" "));
    },
  };

  const sandbox = {
    console: sandboxConsole,
    Math,
    Date,
    JSON,
    Intl,
    input,
    context: { nowIso: new Date().toISOString() },
  };

  const vmContext = vm.createContext(sandbox);

  const source = `
    (async () => {
      "use strict";
      ${codeBody}
    })()
  `;

  const script = new vm.Script(source, {
    filename: "tool-runtime.vm.js",
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`Sandbox execution exceeded ${timeoutMs}ms timeout`));
    }, timeoutMs + 50);
  });

  const execution = script.runInContext(vmContext, {
    timeout: timeoutMs,
  }) as Promise<unknown>;

  const result = await Promise.race([execution, timeoutPromise]);

  return {
    result,
    logs,
    elapsedMs: Date.now() - startedAt,
  };
}
