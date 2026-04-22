"use client";

import { useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";
import toast from "react-hot-toast";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I can create new tools from plain-language requests and run saved tools. Try: build a tool that extracts invoice totals.",
  },
];

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const json = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !json.reply) {
        throw new Error(json.error ?? "Agent request failed.");
      }

      setMessages((current) => [...current, { role: "assistant", content: json.reply ?? "" }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent request failed.";
      toast.error(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Error: ${message}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
        <Bot size={16} />
        Agent Conversation
      </div>

      <div className="mb-3 max-h-80 space-y-2 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-md px-3 py-2 text-sm ${
              message.role === "assistant"
                ? "bg-zinc-800 text-zinc-100"
                : "bg-blue-500/15 text-blue-200"
            }`}
          >
            <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">{message.role}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Build a tool that normalizes CSV rows..."
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
        >
          <SendHorizonal size={14} />
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
