# Build Task: tool-making-agent-building-own-instruments-changes

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: tool-making-agent-building-own-instruments-changes
HEADLINE: The Tool-Making Agent: Why Building Your Own Instruments Changes Everything
WHAT: A platform that lets AI agents build their own custom tools and instruments during conversations, rather than being limited to pre-built functions. Agents can create, test, and iterate on new capabilities in real-time based on the specific task at hand.
WHY: Current AI agents hit walls when they need functionality that doesn't exist in their toolkit. They waste time with workarounds or simply fail. As agents handle more complex workflows, this tool limitation becomes the primary bottleneck to useful automation.
WHO PAYS: AI product managers and developers at startups building agent-powered features who are frustrated by rigid tool constraints. Teams that need agents to handle unpredictable workflows where pre-built tools aren't sufficient.
NICHE: ai-agents
PRICE: $$15/mo

ARCHITECTURE SPEC:
A Next.js platform with a real-time code execution environment where AI agents can dynamically create, test, and deploy custom tools during conversations. Features a sandboxed runtime, tool registry, and conversation interface that allows agents to build functions on-demand and persist them for future use.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/agents/route.ts
- app/api/tools/create/route.ts
- app/api/tools/execute/route.ts
- app/api/sandbox/route.ts
- app/api/webhooks/lemonsqueezy/route.ts
- components/AgentChat.tsx
- components/ToolBuilder.tsx
- components/CodeEditor.tsx
- components/ToolRegistry.tsx
- lib/sandbox.ts
- lib/tool-executor.ts
- lib/agent-engine.ts
- lib/lemonsqueezy.ts
- lib/auth.ts

DEPENDENCIES: next, tailwindcss, @clerk/nextjs, @lemonsqueezy/lemonsqueezy.js, prisma, @prisma/client, vm2, monaco-editor, @monaco-editor/react, socket.io, socket.io-client, openai, zod, react-hot-toast, lucide-react, @radix-ui/react-dialog, @radix-ui/react-tabs

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Stripe Payment Link for payments (hosted checkout — use the URL directly as the Buy button href)
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_STRIPE_PAYMENT_LINK  (full URL, e.g. https://buy.stripe.com/test_XXX)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_test_... or pk_live_...)
- STRIPE_WEBHOOK_SECRET  (set when webhook is wired)

BUY BUTTON RULE: the Buy button's href MUST be `process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
used as-is — do NOT construct URLs from a product ID, do NOT prepend any base URL,
do NOT wrap it in an embed iframe. The link opens Stripe's hosted checkout directly.

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
