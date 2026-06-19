"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, AlertTriangle, Bot, Boxes, Building2, ChartNoAxesCombined, CircleGauge,
  Database, FileBarChart, HardDrive, RadioTower, Settings, ShieldCheck, Siren, Users, Zap
} from "lucide-react";

const nav = [
  ["Overview", "/", CircleGauge], ["System Health", "/system-health", Activity],
  ["Mining Sites", "/sites", Building2], ["Rigs", "/rigs", RadioTower],
  ["Alerts", "/alerts", AlertTriangle], ["Incidents", "/incidents", Siren],
  ["Data Pipelines", "/data-pipelines", Database], ["Data Quality", "/data-quality", ChartNoAxesCombined],
  ["AI Ops Copilot", "/copilot", Bot], ["Assets", "/assets", Boxes],
  ["Vendors", "/vendors", Users], ["Cybersecurity", "/cybersecurity", ShieldCheck],
  ["Reports", "/reports", FileBarChart], ["Settings", "/settings", Settings],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className="min-h-screen lg:flex">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-[#080d15]/95 p-4 lg:flex">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2 py-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint/10 text-mint"><Zap size={22} /></div>
        <div><div className="text-sm font-black tracking-wide text-white">GUARDIAN</div><div className="text-[10px] tracking-[.22em] text-slate-500">AI OPERATIONS</div></div>
      </Link>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {nav.map(([label, href, Icon]) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-mint/10 text-mint" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Icon size={17} /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />}
          </Link>;
        })}
      </nav>
      <div className="mt-4 shrink-0 rounded-xl border border-line bg-white/[.025] p-3">
        <div className="label">Control plane</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300"><span className="status-dot" /> All collectors connected</div>
      </div>
    </aside>
    <main className="min-w-0 flex-1 lg:ml-64">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-ink/75 px-5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3 text-sm text-slate-400"><HardDrive size={16} /><span>Global Operations</span><span className="text-slate-700">/</span><span className="text-slate-200">UAE Region</span></div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3 py-1.5 text-xs text-mint sm:flex"><span className="status-dot" /> Platform operational</div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan to-mint text-xs font-black text-ink">AS</div>
        </div>
      </header>
      <div className="grid-fade min-h-[calc(100vh-4rem)] p-5 lg:p-8">{children}</div>
    </main>
  </div>;
}
