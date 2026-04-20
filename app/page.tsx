"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, Bot, ChartNoAxesCombined, ShieldCheck, Wrench } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const featureCards = [
  {
    icon: Wrench,
    title: "Live Tool Construction",
    description:
      "Agents write and run new JavaScript tools mid-conversation instead of waiting on your engineering backlog."
  },
  {
    icon: ShieldCheck,
    title: "Contained Sandbox",
    description:
      "Each tool run is isolated with execution limits and deterministic logging so teams can trust what ships."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Version + Usage Analytics",
    description:
      "Track which instruments are being reused, where failures happen, and what to optimize next."
  }
];

const faqItems = [
  {
    id: "faq-1",
    question: "What happens when an agent needs functionality we never anticipated?",
    answer:
      "ForgeOps lets the agent create the exact function it needs, test it on sample payloads, then save and re-run it as a reusable instrument."
  },
  {
    id: "faq-2",
    question: "How does access control work after purchase?",
    answer:
      "After Lemon Squeezy confirms payment, enter your order ID and purchase email once. We set a secure HTTP-only cookie that unlocks the workspace."
  },
  {
    id: "faq-3",
    question: "Can teams share tools between agents?",
    answer:
      "Yes. Publish tools to the internal marketplace with version notes so every agent can adopt proven instruments instead of rebuilding from zero."
  },
  {
    id: "faq-4",
    question: "Is this only for one narrow use case?",
    answer:
      "No. This is built for unpredictable workflows where static toolkits fail: data cleanup, integration glue, decision support, and bespoke automations."
  }
];

export default function HomePage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const checkoutUrl = useMemo(() => {
    const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
    const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
    if (!productId || !storeId) {
      return "";
    }

    return `https://checkout.lemonsqueezy.com/buy/${productId}?embed=1&logo=0&desc=0&media=0`;
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setIsLocked(searchParams.get("locked") === "1");
  }, []);

  const handleClaim = async (event: FormEvent) => {
    event.preventDefault();

    if (!orderId.trim() || !email.trim()) {
      toast.error("Enter both order ID and purchase email.");
      return;
    }

    setClaiming(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId, email })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to claim access.");
      }

      toast.success("Access granted. Loading dashboard...");
      window.location.href = "/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to claim access.";
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-xl border border-[#30363d] bg-[#161b22]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f6feb]/15 text-[#58a6ff]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">ForgeOps</p>
              <p className="text-xs text-[#8b949e]">Tool-Making Agent Infrastructure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
            {checkoutUrl ? (
              <Button asChild size="sm">
                <a className="lemonsqueezy-button" href={checkoutUrl}>
                  Start For $15/mo
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Configure Lemon Squeezy Env
              </Button>
            )}
          </div>
        </header>

        {isLocked ? (
          <div className="mt-4 rounded-lg border border-[#f85149]/40 bg-[#da3633]/10 px-4 py-3 text-sm text-[#ffaba8]">
            The workspace is paywalled. Complete checkout, then claim access below.
          </div>
        ) : null}

        <section className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <Badge variant="success" className="w-fit">
              Built For AI Product Teams
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              The Tool-Making Agent: Why Building Your Own Instruments Changes Everything
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[#8b949e] sm:text-lg">
              Most agents fail when the perfect function doesn&apos;t already exist. ForgeOps gives your agent a live workshop where it can create, test, and iterate custom tools during the conversation itself.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {checkoutUrl ? (
                <Button asChild size="lg">
                  <a className="lemonsqueezy-button" href={checkoutUrl}>
                    Unlock The Builder <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  Add `NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID`
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">I Already Purchased</Link>
              </Button>
            </div>
            <p className="text-xs text-[#6e7681]">
              Ideal for startup teams shipping agent-powered features where workflows are unpredictable and rigid toolkits break.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Unlock After Checkout</CardTitle>
                <CardDescription>
                  Paste the same order ID + email from Lemon Squeezy to set your secure access cookie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleClaim}>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-[#8b949e]" htmlFor="order-id">
                      Order ID
                    </label>
                    <Input
                      id="order-id"
                      placeholder="e.g. 123456"
                      value={orderId}
                      onChange={(event) => setOrderId(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-[#8b949e]" htmlFor="purchase-email">
                      Purchase Email
                    </label>
                    <Input
                      id="purchase-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={claiming} type="submit">
                    {claiming ? "Verifying Purchase..." : "Claim Dashboard Access"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="grid gap-4 py-6 md:grid-cols-3">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f6feb]/15 text-[#58a6ff]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </section>

        <section className="py-10">
          <Card>
            <CardHeader>
              <Badge className="w-fit">Pricing</Badge>
              <CardTitle>Simple Plan For Shipping Teams</CardTitle>
              <CardDescription>
                Start small, remove tool bottlenecks now, and scale only when your agent volume grows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <p className="text-4xl font-semibold text-white">
                  $15<span className="text-lg text-[#8b949e]">/month</span>
                </p>
                <ul className="space-y-2 text-sm text-[#8b949e]">
                  <li>Live sandbox for dynamic tool creation and testing</li>
                  <li>Tool marketplace with internal sharing and reuse</li>
                  <li>Version history + execution analytics dashboard</li>
                  <li>Webhook-based purchase verification with secure paywall access</li>
                </ul>
              </div>
              {checkoutUrl ? (
                <Button asChild size="lg">
                  <a className="lemonsqueezy-button" href={checkoutUrl}>
                    Checkout With Lemon Squeezy
                  </a>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  Checkout URL Not Configured
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="py-10">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Practical details for teams deploying tool-building agents in production.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {faqItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
