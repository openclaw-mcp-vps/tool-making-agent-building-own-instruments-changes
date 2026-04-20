export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  goal: string;
  status: "idle" | "building" | "testing" | "deploying";
  createdAt: string;
  updatedAt: string;
  toolsBuilt: number;
  totalExecutions: number;
}

export interface AgentConversation {
  agentId: string;
  messages: AgentMessage[];
}
