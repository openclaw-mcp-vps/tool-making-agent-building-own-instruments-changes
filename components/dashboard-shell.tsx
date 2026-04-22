"use client";

import { useState } from "react";
import { AgentChat } from "@/components/AgentChat";
import { ToolBuilder } from "@/components/ToolBuilder";
import { ToolRegistry } from "@/components/ToolRegistry";

export function DashboardShell() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <ToolBuilder onToolCreated={() => setRefreshKey((value) => value + 1)} />
        <AgentChat />
      </div>
      <ToolRegistry refreshKey={refreshKey} />
    </div>
  );
}
