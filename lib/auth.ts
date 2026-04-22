import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "tma_access";

export function hasAccessCookie(cookieValue: string | undefined): boolean {
  return cookieValue === "granted";
}

export function grantAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "granted",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
