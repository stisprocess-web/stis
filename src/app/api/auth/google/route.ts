/**
 * @module api/auth/google
 * GET /api/auth/google — Initiate Google OAuth flow.
 *
 * Redirects the user to Google's OAuth consent screen.
 * Requires GOOGLE_CLIENT_ID and NEXTAUTH_URL environment variables.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "Google OAuth is not configured. Set the GOOGLE_CLIENT_ID environment variable.",
      },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
