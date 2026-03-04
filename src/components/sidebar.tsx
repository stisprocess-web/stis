"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSearch,
  CheckSquare,
  Receipt,
  FileText,
  UserCog,
  Video,
  BarChart3,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/evidence", label: "Evidence", icon: FileSearch },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/invoicing", label: "Invoicing", icon: Receipt },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/team", label: "Team & 1099", icon: UserCog },
  { href: "/video", label: "Video", icon: Video },
  { href: "/reporting", label: "Reporting", icon: BarChart3 },
  { href: "/ops/daily", label: "Ops Daily", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface UserSession {
  email: string;
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setUser({ email: d.session.email, role: d.session.role });
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-surface transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Shield className="h-6 w-6 shrink-0 text-accent" />
        {!collapsed && <span className="text-lg font-bold tracking-tight">STIS</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        {user && !collapsed && (
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium text-text-primary">{user.email}</p>
            <p className="text-xs capitalize text-text-muted">{user.role}</p>
          </div>
        )}
        <div className={`flex ${collapsed ? "flex-col items-center gap-2" : "items-center gap-2"}`}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-error"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{loggingOut ? "Signing out..." : "Sign out"}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto rounded-lg p-2 text-text-muted hover:bg-white/5 hover:text-text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
