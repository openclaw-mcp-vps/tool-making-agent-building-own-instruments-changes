"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function PurchaseClaimForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter the email you used in checkout.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to unlock access.");
      }

      toast.success("Access unlocked. Redirecting to dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to unlock access.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-lg flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <p className="text-sm text-zinc-300">
        Already paid? Enter your checkout email to activate your session cookie.
      </p>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900"
      >
        {submitting ? "Verifying..." : "Unlock Dashboard"}
      </button>
    </form>
  );
}
