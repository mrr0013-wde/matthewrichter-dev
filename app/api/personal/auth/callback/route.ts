import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, sessionToken } from "@/lib/personal/auth";

// Google OAuth callback: exchanges the code, verifies the ID token belongs to
// the allowed account, then sets the same session cookie the app already uses.

const ALLOWED_EMAIL = "matthew.r.richter@gmail.com";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("personal_oauth_state")?.value;

  const fail = (why: string) => {
    const url = req.nextUrl.clone();
    url.pathname = "/personal";
    url.search = `?auth_error=${encodeURIComponent(why)}`;
    return NextResponse.redirect(url);
  };

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("bad_state");
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("not_configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${req.nextUrl.origin}/api/personal/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail("token_exchange");
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) return fail("no_id_token");

  // Google validates signature + expiry server-side for us.
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`
  );
  if (!infoRes.ok) return fail("tokeninfo");
  const info = (await infoRes.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string;
  };
  if (
    info.aud !== clientId ||
    info.email_verified !== "true" ||
    (info.email || "").toLowerCase() !== ALLOWED_EMAIL
  ) {
    return fail("wrong_account");
  }

  const url = req.nextUrl.clone();
  url.pathname = "/personal";
  url.search = "";
  const res = NextResponse.redirect(url);
  res.cookies.delete("personal_oauth_state");
  res.cookies.set(AUTH_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}
