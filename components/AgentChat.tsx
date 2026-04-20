"use client";

import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SuggestedTool {
  name: string;
  description: string;
  code: string;
}

interface AgentChatProps {
  onSuggestion: (suggestedTool: SuggestedTool) => void;
}

const seedMessages: ChatMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    content:
      "Describe the workflow that is failing. I will draft a tool function you can test in the sandbox immediately."
  }
];

export const AgentChat = ({ onSuggestion }: AgentChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => prompt.trim().length > 0 && !sending, [prompt, sending]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt.trim()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPrompt("");
    setSending(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages.slice(-8)
        })
      });

      const payload = (await response.json()) as {
        reply?: string;
        error?: string;
        suggestedTool?: SuggestedTool;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error ?? "Agent could not respond.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.reply
      };

      setMessages((previous) => [...previous, assistantMessage]);

      if (payload.suggestedTool) {
        onSuggestion(payload.suggestedTool);
        toast.success("Draft tool loaded into builder.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent could not respond.";
      toast.error(message);
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not reach the model. Try a narrower request with concrete input/output examples."
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent Copilot</CardTitle>
            <CardDescription>
              Ask for a custom tool draft based on your workflow constraints.
            </CardDescription>
          </div>
          <Sparkles className="h-5 w-5 text-[#58a6ff]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[260px] space-y-3 overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md border px-3 py-2 text-sm ${
                message.role === "assistant"
                  ? "border-[#1f6feb]/30 bg-[#1f6feb]/10 text-[#dbe9ff]"
                  : "border-[#30363d] bg-[#161b22] text-[#c9d1d9]"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form className="space-y-2" onSubmit={handleSubmit}>
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Create a tool that cleans CRM records and returns invalid entries."
          />
          <Button disabled={!canSend} className="w-full" type="submit">
            <Wand2 className="h-4 w-4" />
            {sending ? "Generating Tool Draft..." : "Generate Draft Tool"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
