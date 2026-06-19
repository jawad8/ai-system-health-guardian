"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, Download, Play, Send, Server, ShieldAlert } from "lucide-react";
import { API, fmtDate, getJSON, postJSON } from "@/lib/api";
import { ErrorState, Loading, Metric, PageHead, Status } from "./UI";

const config: Record<string, { title: string; eyebrow: string; copy: string; endpoint?: string }> = {
  "system-health": { title: "Live system health", eyebrow: "Host observability", copy: "Real-time resource telemetry from the Guardian host, including capacity and process visibility.", endpoint: "/api/system/current" },
  sites: { title: "Mining & compute sites", eyebrow: "Fleet operations", copy: "Health, capacity, environmental conditions, and connectivity across every managed location.", endpoint: "/api/sites" },
  rigs: { title: "Rig fleet", eyebrow: "Compute inventory", copy: "Operational status and performance telemetry for ASIC, GPU, and compute rigs.", endpoint: "/api/rigs" },
  alerts: { title: "Alert center", eyebrow: "Signal management", copy: "Prioritized threshold events from telemetry, power, networking, assets, and data systems.", endpoint: "/api/alerts" },
  incidents: { title: "Incident board", eyebrow: "Service operations", copy: "Track ownership, root cause, SLA exposure, remediation, and recovery.", endpoint: "/api/incidents" },
  "data-pipelines": { title: "Telemetry pipelines", eyebrow: "Data operations", copy: "Observe ingestion, validation, quality gates, storage, and aggregate generation.", endpoint: "/api/data-pipelines" },
  "data-quality": { title: "Data quality", eyebrow: "Trust layer", copy: "Completeness, freshness, validity, duplicates, and error-rate controls.", endpoint: "/api/data-quality" },
  copilot: { title: "AI Ops Copilot", eyebrow: "Operational intelligence", copy: "Ask questions grounded in current site, rig, incident, alert, asset, and vendor data." },
  assets: { title: "Asset register", eyebrow: "Lifecycle management", copy: "Ownership, warranty, firmware, maintenance, and operational risk across critical assets.", endpoint: "/api/assets" },
  vendors: { title: "Vendor management", eyebrow: "Service delivery", copy: "SLA commitments, active tickets, response performance, and escalation contacts.", endpoint: "/api/vendors" },
  cybersecurity: { title: "Cybersecurity posture", eyebrow: "Control & assurance", copy: "Access roles, audit activity, vulnerable assets, failed logins, and key inventory.", endpoint: "/api/security" },
  reports: { title: "Operational reports", eyebrow: "Evidence & insights", copy: "Export health, uptime, incident, power, hashrate, asset, and data quality records." },
  settings: { title: "Platform settings", eyebrow: "Administration", copy: "Runtime configuration, integrations, routing policy, and environment details." },
};

function Table({ rows, columns }: { rows: any[]; columns: [string, string][] }) {
  return <div className="card overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
    <thead className="border-b border-line bg-white/[.02]"><tr>{columns.map(([key, label]) => <th key={key} className="px-5 py-4 label">{label}</th>)}</tr></thead>
    <tbody className="divide-y divide-line">{rows.map((r, i) => <tr key={r.id || i} className="hover:bg-white/[.018]">{columns.map(([key]) => {
      const value = r[key];
      return <td key={key} className="px-5 py-4 text-slate-300">{/status|severity|risk_status|warranty_status/.test(key) ? <Status value={String(value)} /> : /_at|last_seen|heartbeat|maintenance/.test(key) ? fmtDate(value) : value ?? "—"}</td>;
    })}</tr>)}</tbody>
  </table></div>;
}

function SystemHealth({ data }: { data: any }) {
  const cards = [["CPU", data.cpu, "%"], ["Memory", data.ram, "%"], ["Disk", data.disk, "%"], ["Processes", data.process_count, ""], ["Network received", data.network_received_mb, "MB"], ["Uptime", Math.floor(data.uptime_seconds / 3600), "hours"]];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, unit]) => <Metric key={String(label)} label={String(label)} value={value} unit={String(unit)} tone={Number(value) > 85 && unit === "%" ? "red" : "mint"} />)}</div>;
}

function Sites({ data }: { data: any[] }) {
  return <div className="grid gap-5 md:grid-cols-2">{data.map(site => <Link href={`/sites/${site.id}`} key={site.id} className="card group p-5 hover:-translate-y-0.5 hover:border-mint/30">
    <div className="flex items-start justify-between"><div><div className="text-lg font-bold text-white">{site.name}</div><div className="mt-1 text-xs text-slate-500">{site.location} · Heartbeat {fmtDate(site.last_heartbeat)}</div></div><Status value={site.status}/></div>
    <div className="my-5 h-24 rounded-xl border border-line bg-[radial-gradient(circle_at_60%_40%,rgba(55,226,164,.16),transparent_16%),linear-gradient(135deg,#101a28,#0a1019)] p-3">
      <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-500"><span className="status-dot"/> UAE operations map · {site.location}</div>
    </div>
    <div className="grid grid-cols-4 gap-3 text-center"><div><b className="text-white">{site.uptime}%</b><div className="label mt-1">Uptime</div></div><div><b className="text-white">{site.temperature}°</b><div className="label mt-1">Thermal</div></div><div><b className="text-white">{site.hashrate}</b><div className="label mt-1">TH/s</div></div><div><b className="text-white">{site.failed_rigs}</b><div className="label mt-1">Failed</div></div></div>
  </Link>)}</div>;
}

function Copilot() {
  const suggestions = ["Summarize today's operational status", "Which site is currently unhealthy?", "Which rigs are offline?", "What caused the latest incident?", "What should I check first?", "Generate an incident report"];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string; engine?: string }[]>([
    { role: "assistant", text: "I’m grounded in live Guardian data. Ask me about site health, offline rigs, incidents, alerts, vendors, or the next diagnostic step." }
  ]);
  const [busy, setBusy] = useState(false);
  const ask = async (q = question) => {
    if (!q.trim() || busy) return;
    setMessages(m => [...m, { role: "user", text: q }]); setQuestion(""); setBusy(true);
    try { const result = await postJSON("/api/copilot/ask", { question: q }); setMessages(m => [...m, { role: "assistant", text: result.answer, engine: result.engine }]); }
    catch { setMessages(m => [...m, { role: "assistant", text: "The operations API is unavailable. Verify backend connectivity and retry." }]); }
    setBusy(false);
  };
  return <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
    <div className="card flex min-h-[600px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-mint/10 text-mint"><Bot size={19}/></div><div><div className="text-sm font-semibold text-white">Guardian Copilot</div><div className="text-[11px] text-mint">Grounded in current operational data</div></div></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.map((m,i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "bg-cyan/15 text-cyan" : "border border-line bg-white/[.025] text-slate-300"}`}>{m.text}{m.engine && <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">{m.engine} engine</div>}</div></div>)}{busy && <div className="text-xs text-mint animate-pulse">Analyzing platform state…</div>}</div>
      <form onSubmit={e => {e.preventDefault(); ask();}} className="flex gap-2 border-t border-line p-4"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask an operational question…" className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-4 py-3 text-sm outline-none focus:border-mint/50"/><button className="grid w-12 place-items-center rounded-xl bg-mint text-ink"><Send size={17}/></button></form>
    </div>
    <div className="card h-fit p-4"><div className="label">Suggested questions</div><div className="mt-3 space-y-2">{suggestions.map(q => <button onClick={() => ask(q)} key={q} className="w-full rounded-xl border border-line p-3 text-left text-xs leading-5 text-slate-400 hover:border-mint/30 hover:text-white">{q}</button>)}</div></div>
  </div>;
}

function DataQuality({ data }: { data: any }) {
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Quality score" value={data.score} unit="%" /><Metric label="Completeness" value={data.completeness} unit="%" /><Metric label="Freshness" value={data.freshness} unit="%" tone="cyan"/><Metric label="Validity" value={data.validity} unit="%" /><Metric label="Error rate" value={data.error_rate} unit="%" tone="amber"/></div><div className="mt-5"><Table rows={data.failed_records} columns={[["record","Record"],["rule","Failed rule"],["value","Observed value"]]}/></div></>;
}

function Security({ data }: { data: any }) {
  return <><div className="grid gap-4 sm:grid-cols-3"><Metric label="Failed logins · 24h" value={data.failed_logins_24h} tone="amber"/><Metric label="Critical assets" value={data.critical_assets}/><Metric label="API keys tracked" value={data.api_keys} tone="cyan"/></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><div><h2 className="mb-3 font-semibold text-white">Access management</h2><Table rows={data.users} columns={[["email","User"],["role","Role"],["active","Active"]]}/></div><div><h2 className="mb-3 font-semibold text-white">Vulnerabilities</h2><Table rows={data.vulnerabilities} columns={[["asset","Asset"],["severity","Severity"],["finding","Finding"],["status","Status"]]}/></div></div>
    <div className="mt-5"><h2 className="mb-3 font-semibold text-white">Audit log</h2><Table rows={data.audit_logs} columns={[["actor","Actor"],["action","Action"],["resource","Resource"],["ip_address","IP address"],["created_at","Time"]]}/></div></>;
}

function Reports() {
  const reports = [["sites","Fleet uptime & capacity"],["incidents","Incident and MTTR"],["alerts","Alert history"],["assets","Asset risk register"],["pipelines","Pipeline execution"]];
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(([slug,title]) => <div className="card p-5" key={slug}><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/10 text-cyan"><Download size={18}/></div><div className="mt-4 font-semibold text-white">{title}</div><p className="mt-2 text-xs leading-5 text-slate-500">CSV export generated from the current Guardian database.</p><a href={`${API}/api/reports/${slug}.csv`} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-slate-300 hover:border-cyan/40"><Download size={13}/> Export CSV</a></div>)}</div>;
}

function Settings() {
  return <div className="grid gap-5 lg:grid-cols-2"><div className="card p-5"><div className="flex items-center gap-2 font-semibold text-white"><Server size={18} className="text-mint"/> Runtime configuration</div><div className="mt-5 space-y-4">{[["API endpoint", API],["Telemetry interval","10 seconds"],["Database","SQLite / PostgreSQL ready"],["AI engine","Gemini when configured; deterministic fallback"]].map(([a,b]) => <div key={a} className="flex justify-between border-b border-line pb-3 text-sm"><span className="text-slate-500">{a}</span><span className="text-slate-200">{b}</span></div>)}</div></div><div className="card p-5"><div className="flex items-center gap-2 font-semibold text-white"><ShieldAlert size={18} className="text-amber-400"/> Alert routing</div><div className="mt-5 space-y-3">{["Email · NOC distribution","Teams webhook · #ops-alerts","SMS · Critical only"].map(x => <div key={x} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm text-slate-300"><CheckCircle2 size={16} className="text-mint"/>{x}</div>)}</div></div></div>;
}

export function SectionView({ section }: { section: string }) {
  const meta = config[section] || { title: "Not found", eyebrow: "Guardian", copy: "This operational module does not exist." };
  const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = async () => { if (!meta.endpoint) return; try { setData(await getJSON(meta.endpoint)); setError(""); } catch (e:any) { setError(e.message); } };
  useEffect(() => { load(); }, [section]);
  const runPipeline = async () => { setBusy(true); await postJSON("/api/data-pipelines/run"); await load(); setBusy(false); };
  const resolve = async (id:number) => { await fetch(`${API}/api/incidents/${id}/resolve`, {method:"PATCH"}); await load(); };
  const action = section === "data-pipelines" ? <button onClick={runPipeline} className="flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs font-bold text-ink"><Play size={14}/>{busy ? "Running…" : "Run pipeline"}</button> : undefined;
  const content = useMemo(() => {
    if (section === "copilot") return <Copilot/>; if (section === "reports") return <Reports/>; if (section === "settings") return <Settings/>;
    if (error) return <ErrorState message={error}/>; if (!data) return <Loading/>;
    if (section === "system-health") return <SystemHealth data={data}/>; if (section === "sites") return <Sites data={data}/>; if (section === "data-quality") return <DataQuality data={data}/>; if (section === "cybersecurity") return <Security data={data}/>;
    if (section === "rigs") return <Table rows={data} columns={[["rig_id","Rig"],["site_id","Site"],["status","Status"],["temperature","Temp °C"],["hashrate","TH/s"],["power_draw","Power kW"],["fan_speed","Fan RPM"],["error_rate","Error %"],["last_seen","Last seen"]]}/>;
    if (section === "alerts") return <Table rows={data} columns={[["title","Alert"],["severity","Severity"],["source","Source"],["status","Status"],["created_at","Raised"]]}/>;
    if (section === "incidents") return <div className="space-y-3">{data.map((x:any) => <div key={x.id} className="card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div><div className="flex items-center gap-3"><span className="font-semibold text-white">INC-{String(x.id).padStart(4,"0")} · {x.title}</span><Status value={x.severity}/></div><div className="mt-2 text-xs text-slate-500">{x.root_cause} · {x.assigned_team} · Opened {fmtDate(x.created_at)}</div></div><div className="flex items-center gap-3"><Status value={x.status}/>{x.status !== "Resolved" && <button onClick={() => resolve(x.id)} className="rounded-lg border border-line px-3 py-2 text-xs hover:border-mint/40">Resolve</button>}</div></div>)}</div>;
    if (section === "data-pipelines") return <Table rows={data} columns={[["id","Run"],["status","Status"],["records_in","Input"],["records_out","Clean"],["rejected","Rejected"],["duration_ms","Duration ms"],["started_at","Started"]]}/>;
    if (section === "assets") return <Table rows={data} columns={[["asset_id","Asset"],["type","Type"],["vendor","Vendor"],["serial_number","Serial"],["warranty_status","Warranty"],["firmware_version","Firmware"],["risk_status","Risk"]]}/>;
    if (section === "vendors") return <Table rows={data} columns={[["name","Vendor"],["service_category","Service"],["sla_hours","SLA hours"],["open_tickets","Tickets"],["last_response_minutes","Response min"],["status","Status"],["contact","Escalation"]]}/>;
    return <div className="card p-8 text-slate-400">Module ready for configuration.</div>;
  }, [section, data, error, busy]);
  return <><PageHead eyebrow={meta.eyebrow} title={meta.title} copy={meta.copy} action={action}/>{content}</>;
}
