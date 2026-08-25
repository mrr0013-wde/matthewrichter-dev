import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, checkPassword, sessionToken } from "@/lib/personal/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");

  const url = req.nextUrl.clone();
  url.pathname = "/personal";
  url.search = "";

  if (!password || !checkPassword(password)) {
    // brief delay to slow guessing
    await new Promise((r) => setTimeout(r, 750));
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(url, 303);
  res.cookies.set(AUTH_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}
