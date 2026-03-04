/**
 * @module api/auth/google/callback
 * GET /api/auth/google/callback — Handle Google OAuth callback.
 *
 * Exchanges the authorization code for tokens, fetches user info,
 * finds or creates the user in the database, and sets a session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = new URL("/login", baseUrl);

  // --- Validate code parameter ---
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // --- Exchange code for tokens ---
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      loginUrl.searchParams.set("error", "google_auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // --- Fetch user info ---
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );

    if (!userInfoRes.ok) {
      console.error("Google userinfo fetch failed:", await userInfoRes.text());
      loginUrl.searchParams.set("error", "google_auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    // --- Find or create user ---
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          role: "client",
          passwordHash: "",
        },
      });
    }

    // --- Create session ---
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: (user.role as "owner" | "admin" | "investigator" | "billing" | "client") || "client",
    });

    const res = NextResponse.redirect(new URL("/", baseUrl));
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
