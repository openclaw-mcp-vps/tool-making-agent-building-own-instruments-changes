"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Tool } from "@/types/tool";

interface ToolMarketplaceProps {
  onToolExecuted: () => void;
  reloadToken: number;
}

export const ToolMarketplace = ({ onToolExecuted, reloadToken }: ToolMarketplaceProps) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [payload, setPayload] = useState('{"records":[{"email":"HELLO@EXAMPLE.COM"}]}');
  const [executionOutput, setExecutionOutput] = useState<Record<string, unknown>>({});

  const sortedTools = useMemo(
    () => [...tools].sort((a, b) => b.executions - a.executions),
    [tools]
  );

  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/tools/create?visibility=marketplace", {
          method: "GET"
        });

        const payload = (await response.json()) as { tools?: Tool[]; error?: string };

        if (!response.ok || !payload.tools) {
          throw new Error(payload.error ?? "Could not load marketplace tools.");
        }

        setTools(payload.tools);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load marketplace tools.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadTools();
  }, [reloadToken]);

  const runTool = async (toolId: string) => {
    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(payload);
    } catch {
      toast.error("Execution payload must be valid JSON.");
      return;
    }

    setRunningToolId(toolId);

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
        throw new Error(payload.error ?? "Execution failed.");
      }

      setExecutionOutput((previous) => ({
        ...previous,
        [toolId]: payload.execution
      }));

      if (payload.execution.status === "success") {
        toast.success(`Tool executed in ${payload.execution.durationMs}ms.`);
      } else {
        toast.error(payload.execution.error ?? "Tool execution failed.");
      }

      onToolExecuted();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed.";
      toast.error(message);
    } finally {
      setRunningToolId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Marketplace</CardTitle>
        <CardDescription>
          Reuse published instruments and run them against ad-hoc payloads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-[#8b949e]">Execution Payload (JSON)</label>
          <Textarea
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            className="font-mono min-h-[100px]"
          />
        </div>

        {loading ? <p className="text-sm text-[#8b949e]">Loading marketplace...</p> : null}

        {!loading && sortedTools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#30363d] bg-[#0d1117] p-4 text-sm text-[#8b949e]">
            No marketplace tools yet. Save your first tool as <span className="font-semibold">Shared Marketplace</span>.
          </div>
        ) : null}

        <div className="space-y-3">
          {sortedTools.map((tool) => (
            <div key={tool.id} className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{tool.name}</p>
                  <p className="text-xs text-[#8b949e]">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">v{tool.version}</Badge>
                  <Badge variant="success">{tool.executions} runs</Badge>
                  <Button
                    size="sm"
                    onClick={() => runTool(tool.id)}
                    disabled={runningToolId !== null}
                    variant="outline"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {runningToolId === tool.id ? "Running..." : "Run"}
                  </Button>
                </div>
              </div>

              {executionOutput[tool.id] ? (
                <pre className="mt-3 max-h-[180px] overflow-auto rounded-md border border-[#30363d] bg-[#161b22] p-3 text-xs text-[#c9d1d9]">
                  {JSON.stringify(executionOutput[tool.id], null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
