"use client";

import { use, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getJSON } from "@/lib/api";
import { Shell } from "@/components/Shell";
import { ErrorState, Loading, Metric, PageHead, Status } from "@/components/UI";

export default function SiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const [site,setSite]=useState<any>(); const [metrics,setMetrics]=useState<any[]>([]); const [rigs,setRigs]=useState<any[]>([]); const [error,setError]=useState("");
  useEffect(() => { Promise.all([getJSON(`/api/sites/${id}`),getJSON(`/api/sites/${id}/metrics`),getJSON(`/api/sites/${id}/rigs`)]).then(([s,m,r])=>{setSite(s);setMetrics(m);setRigs(r)}).catch(e=>setError(e.message)); },[id]);
  return <Shell>{error ? <ErrorState message={error}/> : !site ? <Loading/> : <>
    <PageHead eyebrow="Site detail" title={site.name} copy={`${site.location} operational telemetry, rig fleet, and environmental posture.`} action={<Status value={site.status}/>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Uptime" value={site.uptime} unit="%"/><Metric label="Temperature" value={site.temperature} unit="°C" tone={site.temperature>75?"red":"mint"}/><Metric label="Hashrate" value={site.hashrate} unit="TH/s" tone="cyan"/><Metric label="Power" value={site.power_kw} unit="kW" tone="amber"/></div>
    <div className="card mt-5 p-5"><div className="label">Telemetry history</div><div className="h-72 pt-4"><ResponsiveContainer><AreaChart data={metrics}><CartesianGrid stroke="#172333"/><XAxis dataKey="recorded_at" hide/><YAxis stroke="#526579"/><Tooltip contentStyle={{background:"#0d1420",border:"1px solid #1c2939"}}/><Area dataKey="temperature" stroke="#fb7185" fill="#fb718522"/><Area dataKey="latency_ms" stroke="#3cc7f5" fill="transparent"/></AreaChart></ResponsiveContainer></div></div>
    <div className="card mt-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left">{["Rig","Status","Temperature","Hashrate","Power","Fan","Error rate"].map(x=><th className="p-4 label" key={x}>{x}</th>)}</tr></thead><tbody>{rigs.map(r=><tr className="border-b border-line" key={r.id}><td className="p-4 text-white">{r.rig_id}</td><td className="p-4"><Status value={r.status}/></td><td className="p-4">{r.temperature}°C</td><td className="p-4">{r.hashrate} TH/s</td><td className="p-4">{r.power_draw} kW</td><td className="p-4">{r.fan_speed} RPM</td><td className="p-4">{r.error_rate}%</td></tr>)}</tbody></table></div>
  </>}</Shell>;
}
