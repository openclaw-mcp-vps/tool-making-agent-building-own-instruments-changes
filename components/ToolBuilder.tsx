"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Play, Save, TestTube2 } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Tool } from "@/types/tool";

interface BuilderSeed {
  name: string;
  description: string;
  code: string;
}

interface ToolBuilderProps {
  seed?: BuilderSeed;
  onToolSaved: (tool: Tool) => void;
}

const defaultCode = `module.exports = async function(input) {
  const records = Array.isArray(input.records) ? input.records : [];

  const cleaned = records
    .filter((row) => row && row.email)
    .map((row) => ({
      ...row,
      email: String(row.email).toLowerCase().trim()
    }));

  const invalid = records.filter((row) => !row || !row.email);

  return {
    cleanedCount: cleaned.length,
    invalidCount: invalid.length,
    cleaned,
    invalid
  };
};`;

export const ToolBuilder = ({ seed, onToolSaved }: ToolBuilderProps) => {
  const [toolId, setToolId] = useState<string | null>(null);
  const [name, setName] = useState("CRM Record Cleaner");
  const [description, setDescription] = useState(
    "Normalizes incoming CRM records and isolates rows missing required email values."
  );
  const [code, setCode] = useState(defaultCode);
  const [inputJson, setInputJson] = useState(
    JSON.stringify(
      {
        records: [
          { name: "Ari", email: "ARI@EXAMPLE.COM " },
          { name: "Maya", email: "maya@example.com" },
          { name: "NoEmail" }
        ]
      },
      null,
      2
    )
  );
  const [tags, setTags] = useState("data-cleaning,crm");
  const [visibility, setVisibility] = useState<"private" | "marketplace">("marketplace");
  const [busy, setBusy] = useState<"idle" | "saving" | "testing" | "executing">("idle");
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    if (!seed) {
      return;
    }

    setName(seed.name);
    setDescription(seed.description);
    setCode(seed.code);
    setToolId(null);
  }, [seed]);

  const parsedInput = useMemo(() => {
    try {
      return JSON.parse(inputJson) as unknown;
    } catch {
      return null;
    }
  }, [inputJson]);

  const runSandboxTest = async () => {
    if (parsedInput === null) {
      toast.error("Input must be valid JSON before testing.");
      return;
    }

    setBusy("testing");
    setSandboxLogs([]);
    setResult(null);

    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, input: parsedInput })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Sandbox execution failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          const event = JSON.parse(trimmed) as {
            type: "stage" | "result" | "error";
            message?: string;
            output?: unknown;
            logs?: string[];
            durationMs?: number;
            error?: string;
          };

          if (event.type === "stage") {
            const message = event.message;
            if (typeof message === "string") {
              setSandboxLogs((previous) => [...previous, message]);
            }
          }

          if (event.type === "result") {
            setResult({
              output: event.output,
              logs: event.logs,
              durationMs: event.durationMs
            });
            setSandboxLogs((previous) => [...previous, "Sandbox finished successfully."]);
          }

          if (event.type === "error") {
            throw new Error(event.error ?? "Sandbox failed.");
          }
        }
      }

      toast.success("Sandbox test completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sandbox test failed.";
      toast.error(message);
      setSandboxLogs((previous) => [...previous, `Error: ${message}`]);
    } finally {
      setBusy("idle");
    }
  };

  const saveTool = async () => {
    if (!name.trim() || !description.trim() || !code.trim()) {
      toast.error("Name, description, and code are required.");
      return;
    }

    setBusy("saving");

    try {
      const response = await fetch("/api/tools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId,
          name,
          description,
          code,
          notes: toolId ? "Iteration update from builder" : "Initial release",
          authorAgentId: "agent-builder-1",
          visibility,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      });

      const payload = (await response.json()) as { tool?: Tool; error?: string };

      if (!response.ok || !payload.tool) {
        throw new Error(payload.error ?? "Unable to save tool.");
      }

      setToolId(payload.tool.id);
      onToolSaved(payload.tool);
      toast.success(toolId ? "New tool version saved." : "Tool published successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save tool.";
      toast.error(message);
    } finally {
      setBusy("idle");
    }
  };

  const executeSavedTool = async () => {
    if (!toolId) {
      toast.error("Save the tool first before running marketplace execution.");
      return;
    }

    if (parsedInput === null) {
      toast.error("Input must be valid JSON before execution.");
      return;
    }

    setBusy("executing");

    try {
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId,
          input: parsedInput
        })
      });

      const payload = (await response.json()) as {
        execution?: {
          output?: unknown;
          error?: string;
          status: "success" | "error";
          durationMs: number;
        };
        error?: string;
      };

      if (!response.ok || !payload.execution) {
        throw new Error(payload.error ?? "Execution request failed.");
      }

      setResult(payload.execution);
      if (payload.execution.status === "success") {
        toast.success(`Executed successfully in ${payload.execution.durationMs}ms.`);
      } else {
        toast.error(payload.execution.error ?? "Execution failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed.";
      toast.error(message);
    } finally {
      setBusy("idle");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Tool Builder</CardTitle>
            <CardDescription>
              Create and iterate custom instruments with versioned saves and live sandbox feedback.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={toolId ? "success" : "warning"}>{toolId ? "Versioned Tool" : "Unsaved Draft"}</Badge>
            {toolId ? <span className="text-xs text-[#8b949e]">id: {toolId}</span> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#8b949e]">Tool Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#8b949e]">Tags</label>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="e.g. cleanup,validation"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-[#8b949e]">Description</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-[#8b949e]">Tool Code</label>
          <CodeEditor value={code} onChange={setCode} />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-[#8b949e]">Test Input (JSON)</label>
          <Textarea
            value={inputJson}
            onChange={(event) => setInputJson(event.target.value)}
            className="font-mono min-h-[140px]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={visibility === "marketplace" ? "default" : "outline"}
            onClick={() => setVisibility("marketplace")}
          >
            Shared Marketplace
          </Button>
          <Button
            type="button"
            variant={visibility === "private" ? "default" : "outline"}
            onClick={() => setVisibility("private")}
          >
            Private Only
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" onClick={runSandboxTest} disabled={busy !== "idle"} variant="outline">
            <TestTube2 className="h-4 w-4" />
            {busy === "testing" ? "Testing..." : "Test In Sandbox"}
          </Button>
          <Button type="button" onClick={saveTool} disabled={busy !== "idle"}>
            <Save className="h-4 w-4" />
            {busy === "saving" ? "Saving..." : toolId ? "Save New Version" : "Save Tool"}
          </Button>
          <Button type="button" onClick={executeSavedTool} disabled={busy !== "idle" || !toolId} variant="outline">
            <Play className="h-4 w-4" />
            {busy === "executing" ? "Executing..." : "Run Saved Tool"}
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-[#8b949e]">Sandbox Timeline</p>
            {sandboxLogs.length === 0 ? (
              <p className="text-sm text-[#6e7681]">No sandbox run yet.</p>
            ) : (
              <ul className="space-y-1 text-sm text-[#8b949e]">
                {sandboxLogs.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-[#8b949e]">Latest Output</p>
            {result ? (
              <pre className="max-h-[180px] overflow-auto text-xs text-[#c9d1d9]">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-[#6e7681]">No output yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
