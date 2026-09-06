import React from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { href: "/challenges", label: "Challenges" },
  { href: "/universities", label: "Universities" },
  { href: "/projects", label: "Projects" },
  { href: "/industry", label: "Industry" },
  { href: "/dashboard", label: "Government Dashboard" },
  { href: "/knowledge", label: "Innovation Graph" },
  { href: "/mentor", label: "Mentor Copilot" },
];

export function Nav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-sm font-bold text-white">JS</span>
          <span className="text-base font-semibold tracking-tight text-slate-900">JanaSetu <span className="font-normal text-slate-500">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                to={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/challenges/new"
          className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors shadow-sm"
        >
          Report a Problem
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-xs ${
              pathname.startsWith(l.href) ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
