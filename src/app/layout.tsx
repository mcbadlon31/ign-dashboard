import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "IGN Trajectory",
  description: "Discipleship trajectory planner",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/outreach", label: "Outreach" },
  { href: "/roles", label: "Roles" },
  { href: "/goal/new", label: "Start Goal" },
  { href: "/import", label: "Import" },
  { href: "/views", label: "Saved Views" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl p-6">
          <nav className="mb-6 flex flex-wrap gap-4 text-sm">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 transition hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
