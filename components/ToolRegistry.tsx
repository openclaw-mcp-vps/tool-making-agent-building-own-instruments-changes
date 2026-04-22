"use client";

import { useEffect, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import toast from "react-hot-toast";

type Tool = {
  id: string;
  name: string;
  description: string;
  executionCount: number;
  updatedAt: string;
};

type ToolRegistryProps = {
  refreshKey: number;
};

export function ToolRegistry({ refreshKey }: ToolRegistryProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState("");
  const [inputJson, setInputJson] = useState('{"text":"Try your tool here"}');
  const [outputJson, setOutputJson] = useState("Execution output appears here.");

  const parsedInput = useMemo(() => {
    try {
      return JSON.parse(inputJson);
    } catch {
      return null;
    }
  }, [inputJson]);

  useEffect(() => {
    let isMounted = true;

    async function loadTools() {
      setLoading(true);
      try {
        const response = await fetch("/api/tools/create");
        const json = (await response.json()) as { tools?: Tool[] };

        if (!isMounted) {
          return;
        }

        const nextTools = json.tools ?? [];
        setTools(nextTools);
        if (nextTools.length > 0 && !selectedName) {
          setSelectedName(nextTools[0].name);
        }
      } catch {
        if (isMounted) {
          toast.error("Unable to load tool registry.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTools();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function executeTool() {
    if (!selectedName) {
      toast.error("Select a tool first.");
      return;
    }

    if (parsedInput === null) {
      toast.error("Execution input must be valid JSON.");
      return;
    }

    try {
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: selectedName,
          input: parsedInput,
        }),
      });

      const json = (await response.json()) as {
        run?: { result: unknown; logs: string[]; elapsedMs: number };
        error?: string;
      };

      if (!response.ok || !json.run) {
        throw new Error(json.error ?? "Execution failed.");
      }

      setOutputJson(JSON.stringify(json.run, null, 2));
      toast.success("Tool executed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed.";
      setOutputJson(message);
      toast.error(message);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
        <ListChecks size={16} />
        Tool Registry
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading tools...</p>
      ) : tools.length === 0 ? (
        <p className="text-sm text-zinc-400">No tools created yet. Build your first one in the Tool Builder tab.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            {tools.map((tool) => (
              <button
                type="button"
                key={tool.id}
                onClick={() => setSelectedName(tool.name)}
                className={`rounded-md border p-3 text-left text-sm ${
                  selectedName === tool.name
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <p className="font-semibold text-zinc-100">{tool.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{tool.description}</p>
                <p className="mt-2 text-[11px] text-zinc-500">Runs: {tool.executionCount}</p>
              </button>
            ))}
          </div>

          <label className="block text-xs text-zinc-300">
            Input JSON
            <textarea
              rows={4}
              value={inputJson}
              onChange={(event) => setInputJson(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={executeTool}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Execute Selected Tool
          </button>

          <pre className="max-h-64 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-200">
            {outputJson}
          </pre>
        </div>
      )}
    </section>
  );
}
