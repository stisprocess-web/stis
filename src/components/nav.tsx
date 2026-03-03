/**
 * @module components/nav
 * Primary navigation bar displayed at the top of every authenticated page.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Navigation link definition. */
interface NavLink {
  href: string;
  label: string;
}

const links: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/clients", label: "Clients" },
  { href: "/evidence", label: "Evidence" },
  { href: "/tasks", label: "Tasks" },
  { href: "/invoicing", label: "Invoicing" },
  { href: "/team", label: "Team & 1099" },
  { href: "/reporting", label: "Reporting" },
  { href: "/video", label: "Video" },
  { href: "/ops/daily", label: "Ops" },
  { href: "/contracts", label: "Contracts" },
  { href: "/settings", label: "Settings" },
];

/** Primary navigation component with active link highlighting. */
export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 rounded-xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <ul className="flex flex-wrap gap-1">
        {links.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`inline-flex rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
