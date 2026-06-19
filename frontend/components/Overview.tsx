"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Play, RefreshCw } from "lucide-react";
import { getJSON, postJSON } from "@/lib/api";
import { ErrorState, Loading, Metric, PageHead, Status } from "./UI";

export function Overview() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [o, h, s, a] = await Promise.all([getJSON("/api/overview"), getJSON("/api/system/history?limit=28"), getJSON("/api/sites"), getJSON("/api/alerts")]);
      setData(o); setHistory(h); setSites(s); setAlerts(a); setError("");
    } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);
  const action = async (kind: "demo" | "check") => {
    setBusy(kind);
    await postJSON(kind === "demo" ? "/api/incidents/demo" : "/api/system/health-check");
    await load(); setBusy("");
  };
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Loading />;
  const severities = ["Critical", "Warning", "Info"].map(name => ({ name, value: alerts.filter(a => a.severity === name).length }));
  return <>
    <PageHead eyebrow="Command Center" title="Infrastructure at a glance" copy="Live operational posture across host systems, AI compute, mining capacity, data pipelines, and incidents."
      action={<div className="flex gap-2">
        <button onClick={() => action("check")} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs text-slate-200 hover:border-cyan/50"><RefreshCw size={14} className={busy === "check" ? "animate-spin" : ""}/> Run health check</button>
        <button onClick={() => action("demo")} className="flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs font-bold text-ink hover:bg-emerald-300"><Play size={14}/> Trigger demo incident</button>
      </div>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Platform health" value={data.platform_health.score} unit="/ 100" tone={data.platform_health.score < 70 ? "red" : "mint"} delta="-2.1%" />
      <Metric label="Fleet uptime" value={data.current_uptime} unit="%" delta="+0.04%" />
      <Metric label="Active incidents" value={data.active_incidents} tone={data.active_incidents ? "amber" : "mint"} />
      <Metric label="Critical alerts" value={data.critical_alerts} tone={data.critical_alerts ? "red" : "mint"} />
      <Metric label="Total hashrate" value={data.total_hashrate.toLocaleString()} unit="TH/s" tone="cyan" delta="+1.8%" />
      <Metric label="Power draw" value={data.total_power_kw.toLocaleString()} unit="kW" tone="amber" />
      <Metric label="Average thermal" value={data.average_temperature} unit="°C" tone={data.average_temperature > 70 ? "red" : "mint"} />
      <Metric label="Data quality" value={data.data_quality_score} unit="%" tone="cyan" delta="+0.3%" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
      <div className="card p-5">
        <div className="flex items-center justify-between"><div><div className="label">Host utilization</div><div className="mt-1 text-sm text-slate-300">CPU, memory, and disk trend</div></div><Activity size={18} className="text-mint" /></div>
        <div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}>
          <defs><linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37e2a4" stopOpacity=".35"/><stop offset="1" stopColor="#37e2a4" stopOpacity="0"/></linearGradient></defs>
          <CartesianGrid stroke="#172333" vertical={false}/><XAxis dataKey="recorded_at" hide/><YAxis stroke="#526579" fontSize={11}/><Tooltip contentStyle={{background:"#0d1420",border:"1px solid #1c2939",borderRadius:12}}/>
          <Area type="monotone" dataKey="cpu" stroke="#37e2a4" fill="url(#cpu)" strokeWidth={2}/><Area type="monotone" dataKey="ram" stroke="#3cc7f5" fill="transparent" strokeWidth={2}/><Area type="monotone" dataKey="disk" stroke="#fbbf24" fill="transparent" strokeWidth={2}/>
        </AreaChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5">
        <div className="label">Incident distribution</div><div className="mt-1 text-sm text-slate-300">Alerts by severity</div>
        <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severities} dataKey="value" innerRadius={54} outerRadius={75} paddingAngle={4}>{["#fb7185","#fbbf24","#3cc7f5"].map(c => <Cell key={c} fill={c}/>)}</Pie><Tooltip contentStyle={{background:"#0d1420",border:"1px solid #1c2939"}}/></PieChart></ResponsiveContainer></div>
        <div className="grid grid-cols-3 gap-2 text-center">{severities.map((s,i) => <div key={s.name}><div className="text-lg font-bold" style={{color:["#fb7185","#fbbf24","#3cc7f5"][i]}}>{s.value}</div><div className="text-[10px] uppercase text-slate-500">{s.name}</div></div>)}</div>
      </div>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="card overflow-hidden"><div className="border-b border-line p-5"><div className="label">Site posture</div></div>
        <div className="divide-y divide-line">{sites.map(site => <div key={site.id} className="grid grid-cols-[1.4fr_.7fr_.7fr_auto] items-center gap-3 p-4 text-sm">
          <div><div className="font-semibold text-white">{site.name}</div><div className="text-xs text-slate-500">{site.location}</div></div><div><div className="text-slate-300">{site.temperature}°C</div><div className="text-[10px] text-slate-600">THERMAL</div></div><div><div className="text-slate-300">{site.hashrate} TH/s</div><div className="text-[10px] text-slate-600">HASHRATE</div></div><Status value={site.status}/>
        </div>)}</div>
      </div>
      <div className="card p-5"><div className="label">Health intelligence</div><div className="mt-4 rounded-xl border border-mint/15 bg-mint/[.04] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-mint"><span className="status-dot"/> Guardian analysis</div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{data.platform_health.explanation}</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">{data.platform_health.recommended_action}</p>
      </div>
      <div className="mt-5 h-36"><ResponsiveContainer width="100%" height="100%"><BarChart data={sites}><CartesianGrid stroke="#172333" vertical={false}/><XAxis dataKey="location" stroke="#526579" fontSize={10}/><YAxis hide/><Tooltip contentStyle={{background:"#0d1420",border:"1px solid #1c2939"}}/><Bar dataKey="hashrate" fill="#3cc7f5" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  </>;
}
