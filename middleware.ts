import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "agent_tool_access";

const requiresPaywall = (pathname: string) => {
  if (pathname.startsWith("/dashboard")) {
    return true;
  }

  if (pathname.startsWith("/api/agents")) {
    return true;
  }

  if (pathname.startsWith("/api/tools")) {
    return true;
  }

  if (pathname.startsWith("/api/sandbox")) {
    return true;
  }

  return false;
};

const isExempt = (pathname: string) => {
  if (pathname.startsWith("/api/health")) {
    return true;
  }

  if (pathname.startsWith("/api/webhooks/lemonsqueezy")) {
    return true;
  }

  if (pathname.startsWith("/api/access/claim")) {
    return true;
  }

  return false;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!requiresPaywall(pathname) || isExempt(pathname)) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get(ACCESS_COOKIE)?.value === "granted";

  if (hasAccess) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "This endpoint is available after purchase."
      },
      { status: 402 }
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("locked", "1");

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
