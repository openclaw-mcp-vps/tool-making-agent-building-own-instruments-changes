import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, CircleCheck, Wrench } from "lucide-react";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";
import { AppToaster } from "@/components/AppToaster";
import { PurchaseClaimForm } from "@/components/PurchaseClaimForm";

const faq = [
  {
    q: "What makes this different from normal AI agents?",
    a: "Most agents can only call predefined tools. This platform lets agents write and test new tools during a conversation, then save them to reuse later.",
  },
  {
    q: "How does the paywall work?",
    a: "After Stripe checkout completes, the webhook stores your purchase email. You confirm that email once, and the app sets an access cookie for dashboard use.",
  },
  {
    q: "Can teams use this for unpredictable workflows?",
    a: "Yes. The core value is handling edge-case tasks by building exactly the missing capability instead of forcing brittle workarounds.",
  },
  {
    q: "Is code execution isolated?",
    a: "Tools run inside a constrained VM sandbox with execution timeout and no external module loading by default.",
  },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAccess = hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value);

  return (
    <main className="grid-shell min-h-screen px-4 pb-16 pt-8 text-zinc-100 md:px-8">
      <AppToaster />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
            <Wrench size={14} />
            AI Agents Niche
          </div>
          {hasAccess ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Open Dashboard <ArrowRight size={14} />
            </Link>
          ) : null}
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
              The Tool-Making Agent
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Why Building Your Own Instruments Changes Everything
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-zinc-300">
              Agents fail when the right function does not exist. This platform gives them a runtime where they can
              build custom tools on-demand, validate behavior safely, and keep winning strategies in a persistent
              registry for future tasks.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Start at $15/mo
                <ArrowRight size={15} />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500"
              >
                See Product Interface
              </Link>
            </div>
          </div>

          <aside className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-sm font-semibold text-zinc-200">Built For Teams Shipping Agent Features</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2">
                <CircleCheck size={16} className="mt-0.5 text-emerald-400" />
                Product managers blocked by rigid tool lists
              </li>
              <li className="flex gap-2">
                <CircleCheck size={16} className="mt-0.5 text-emerald-400" />
                Startups with unpredictable automation workflows
              </li>
              <li className="flex gap-2">
                <CircleCheck size={16} className="mt-0.5 text-emerald-400" />
                Developers needing runtime capability iteration
              </li>
            </ul>
            <div className="mt-5 rounded-md border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Core Offer</p>
              <p className="mt-1 text-sm text-zinc-200">Tool-making runtime + registry + agent chat</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-50">$15/mo</p>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
            <h2 className="text-lg font-semibold">Problem</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Fixed toolkits break on edge cases. Agents burn cycles with brittle workarounds or fail outright when the
              needed operation is missing.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
            <h2 className="text-lg font-semibold">Solution</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Give agents a builder interface and sandbox runtime so they can write, test, and deploy new tools during
              active conversations.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
            <h2 className="text-lg font-semibold">Outcome</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Fewer dead ends, faster adaptation, and reusable internal instruments that compound over time as tasks get
              more complex.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
            <h2 className="text-2xl font-semibold">Pricing That Matches Builder Teams</h2>
            <p className="mt-2 text-sm text-zinc-300">
              One simple tier gives your product team continuous access to the full tool-building dashboard.
            </p>
            <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-200">Tool-Making Agent Platform</p>
              <p className="mt-1 text-3xl font-semibold text-white">$15<span className="text-sm text-zinc-300">/mo</span></p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                <li>Dynamic tool creation and versioned registry</li>
                <li>Sandbox execution with runtime output inspection</li>
                <li>Agent chat that can generate and run new tools</li>
                <li>Persistent capabilities for future conversations</li>
              </ul>
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="mt-4 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Buy Access
              </a>
            </div>
          </div>

          <PurchaseClaimForm />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-5 grid gap-3">
            {faq.map((item) => (
              <article key={item.q} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">{item.q}</h3>
                <p className="mt-1 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
