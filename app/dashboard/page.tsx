import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";
import { AppToaster } from "@/components/AppToaster";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const access = hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value);

  if (!access) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0d1117] px-4 py-8 text-zinc-100 md:px-8">
      <AppToaster />
      <div className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-300">Paid Workspace</p>
          <h1 className="text-2xl font-semibold">Tool-Making Agent Dashboard</h1>
        </div>
        <Link href="/" className="text-sm text-zinc-300 hover:text-zinc-100">
          Back to landing
        </Link>
      </div>

      <DashboardShell />
    </main>
  );
}
