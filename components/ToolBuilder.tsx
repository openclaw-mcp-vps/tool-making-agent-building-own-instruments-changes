"use client";

import { useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Hammer, Play, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { CodeEditor } from "@/components/CodeEditor";

type ToolBuilderProps = {
  onToolCreated: () => void;
};

const starterCode = `
const text = String(input?.text ?? "");
const urls = text.match(/https?:\\/\\/[^\\s]+/g) ?? [];

return {
  urlCount: urls.length,
  urls,
  timestamp: context.nowIso
};
`.trim();

export function ToolBuilder({ onToolCreated }: ToolBuilderProps) {
  const [name, setName] = useState("extract_urls");
  const [description, setDescription] = useState(
    "Extract every URL from a text block and return count + list.",
  );
  const [code, setCode] = useState(starterCode);
  const [sandboxInput, setSandboxInput] = useState('{"text":"Read docs at https://nextjs.org and https://stripe.com/docs."}');
  const [sandboxOutput, setSandboxOutput] = useState("Run a sandbox test to validate your tool logic before saving.");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const parsedInput = useMemo(() => {
    try {
      return JSON.parse(sandboxInput);
    } catch {
      return null;
    }
  }, [sandboxInput]);

  async function createTool() {
    setSaving(true);
    try {
      const response = await fetch("/api/tools/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          code,
        }),
      });

      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not create tool.");
      }

      toast.success(`Saved ${name}`);
      onToolCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected create error.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function runSandbox() {
    if (parsedInput === null) {
      toast.error("Sandbox input must be valid JSON.");
      return;
    }

    setTesting(true);

    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code,
          input: parsedInput,
        }),
      });

      const json = (await response.json()) as {
        run?: { result: unknown; logs: string[]; elapsedMs: number };
        error?: string;
      };

      if (!response.ok || !json.run) {
        throw new Error(json.error ?? "Sandbox run failed.");
      }

      setSandboxOutput(
        JSON.stringify(
          {
            result: json.run.result,
            logs: json.run.logs,
            elapsedMs: json.run.elapsedMs,
          },
          null,
          2,
        ),
      );
      toast.success("Sandbox run complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected sandbox error.";
      setSandboxOutput(message);
      toast.error(message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-300">
        <Wrench size={16} />
        Tool Builder
      </div>

      <Tabs.Root defaultValue="build" className="w-full">
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger
            value="build"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs data-[state=active]:border-blue-500 data-[state=active]:text-blue-300"
          >
            Build
          </Tabs.Trigger>
          <Tabs.Trigger
            value="test"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-300"
          >
            Sandbox Test
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="build" className="space-y-3">
          <label className="block text-xs text-zinc-300">
            Tool name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block text-xs text-zinc-300">
            Purpose
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <div className="rounded-lg border border-zinc-800">
            <CodeEditor value={code} onChange={setCode} />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={createTool}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
          >
            <Hammer size={16} />
            {saving ? "Saving..." : "Save Tool"}
          </button>
        </Tabs.Content>

        <Tabs.Content value="test" className="space-y-3">
          <label className="block text-xs text-zinc-300">
            Test input (JSON)
            <textarea
              value={sandboxInput}
              onChange={(event) => setSandboxInput(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="button"
            onClick={runSandbox}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900"
          >
            <Play size={16} />
            {testing ? "Running..." : "Run in Sandbox"}
          </button>

          <pre className="max-h-64 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-200">
            {sandboxOutput}
          </pre>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
