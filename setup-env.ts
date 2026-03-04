/**
 * @module setup-env
 * Cloudflare Pages + Next.js edge runtime setup.
 *
 * Import this in route handlers that need to declare edge runtime.
 * See: https://developers.cloudflare.com/pages/framework-guides/nextjs/
 */
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}
