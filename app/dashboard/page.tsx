"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { Activity, Bot, Gauge, Layers, ShieldCheck, Timer } from "lucide-react";
import { AgentChat } from "@/components/AgentChat";
import { ToolBuilder } from "@/components/ToolBuilder";
import { ToolMarketplace } from "@/components/ToolMarketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/types/agent";
import type { Tool, ToolAnalytics, ToolExecution } from "@/types/tool";

interface DashboardPayload {
  agents: Agent[];
  tools: Tool[];
  analytics: ToolAnalytics;
  recentExecutions: ToolExecution[];
}

const emptyPayload: DashboardPayload = {
  agents: [],
  tools: [],
  analytics: {
    totalTools: 0,
    totalExecutions: 0,
    successRate: 100,
    avgExecutionMs: 0
  },
  recentExecutions: []
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [seed, setSeed] = useState<{
    name: string;
    description: string;
    code: string;
  }>();

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/agents", { method: "GET" });
      const payload = (await response.json()) as DashboardPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load dashboard data.");
      }

      setDashboard(payload);
    } catch {
      setDashboard(emptyPayload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, reloadToken]);

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#58a6ff]">Paywalled Workspace</p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                Dynamic Instrument Builder Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#8b949e]">
                Create, test, version, and run tools while agents continue the conversation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setReloadToken((current) => current + 1)}>
                Refresh Metrics
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/">Back To Landing</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Layers}
            label="Tools Built"
            value={String(dashboard.analytics.totalTools)}
            helper="Versioned instruments"
            loading={loading}
          />
          <MetricCard
            icon={Activity}
            label="Executions"
            value={String(dashboard.analytics.totalExecutions)}
            helper="Runs across all tools"
            loading={loading}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Success Rate"
            value={`${dashboard.analytics.successRate}%`}
            helper="Recent reliability"
            loading={loading}
          />
          <MetricCard
            icon={Timer}
            label="Avg Runtime"
            value={`${dashboard.analytics.avgExecutionMs}ms`}
            helper="Per execution"
            loading={loading}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ToolBuilder
            seed={seed}
            onToolSaved={() => {
              setReloadToken((current) => current + 1);
            }}
          />
          <div className="space-y-4">
            <AgentChat
              onSuggestion={(suggested) => {
                setSeed(suggested);
              }}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-[#58a6ff]" />
                  Recent Executions
                </CardTitle>
                <CardDescription>Latest runs across every created instrument.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.recentExecutions.length === 0 ? (
                  <p className="text-sm text-[#8b949e]">Run a saved tool to populate execution telemetry.</p>
                ) : (
                  dashboard.recentExecutions.slice(0, 6).map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{execution.toolName}</p>
                        <p className="text-xs text-[#8b949e]">
                          {new Date(execution.executedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={execution.status === "success" ? "success" : "warning"}>
                          {execution.status}
                        </Badge>
                        <span className="font-mono text-xs text-[#8b949e]">{execution.durationMs}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.42fr]">
          <ToolMarketplace
            reloadToken={reloadToken}
            onToolExecuted={() => {
              setReloadToken((current) => current + 1);
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#58a6ff]" />
                Active Agents
              </CardTitle>
              <CardDescription>State of agents creating and running custom instruments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.agents.length === 0 ? (
                <p className="text-sm text-[#8b949e]">No agents registered yet.</p>
              ) : (
                dashboard.agents.map((agent) => (
                  <div key={agent.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="mt-1 text-xs text-[#8b949e]">{agent.goal}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#8b949e]">
                      <span>{agent.toolsBuilt} tools built</span>
                      <span>{agent.totalExecutions} executions</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  loading: boolean;
  icon: ComponentType<{ className?: string }>;
}

const MetricCard = ({ label, value, helper, loading, icon: Icon }: MetricCardProps) => (
  <Card>
    <CardHeader>
      <CardDescription className="flex items-center justify-between">
        {label}
        <Icon className="h-4 w-4 text-[#58a6ff]" />
      </CardDescription>
      <CardTitle className="text-3xl">{loading ? "..." : value}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-[#8b949e]">{helper}</p>
    </CardContent>
  </Card>
);
