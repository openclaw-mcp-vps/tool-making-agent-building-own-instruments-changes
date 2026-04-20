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
A Next.js platform with a real-time code execution sandbox where AI agents can dynamically create, test, and deploy custom tools during conversations. Features a tool marketplace, version control for agent-created instruments, and usage analytics dashboard.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/agents/route.ts
- app/api/tools/create/route.ts
- app/api/tools/execute/route.ts
- app/api/sandbox/route.ts
- app/api/webhooks/lemonsqueezy/route.ts
- components/ToolBuilder.tsx
- components/CodeEditor.tsx
- components/AgentChat.tsx
- components/ToolMarketplace.tsx
- lib/sandbox.ts
- lib/tool-registry.ts
- lib/lemonsqueezy.ts
- types/agent.ts
- types/tool.ts

DEPENDENCIES: next, react, tailwindcss, @monaco-editor/react, socket.io, socket.io-client, prisma, @prisma/client, openai, vm2, @lemonsqueezy/lemonsqueezy.js, stripe, zustand, react-hot-toast, lucide-react, framer-motion

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
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
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
