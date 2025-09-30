import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { MainNav } from "@/components/layout/MainNav";

export const metadata: Metadata = {
  title: "IGN Trajectory",
  description: "Discipleship trajectory planner",
};

const inter = Inter({ subsets: ["latin"] });

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/outreach", label: "Outreach" },
  { href: "/roles", label: "Roles" },
  { href: "/planner", label: "Planner" },
  { href: "/tracker", label: "Tracker" },
  { href: "/evaluations", label: "Evaluations" },
  { href: "/goal/new", label: "Start Goal" },
  { href: "/import", label: "Import" },
  { href: "/views", label: "Saved Views" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-100">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white text-slate-900`}>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
              <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  IGN
                </span>
                Trajectory
              </Link>
              <MainNav links={NAV_LINKS} />
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            <main className="space-y-10 pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
