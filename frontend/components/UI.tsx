import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div><div className="label mb-2 text-mint">{eyebrow}</div><h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">{copy}</p></div>
    {action}
  </div>;
}

export function Metric({ label, value, unit, delta, tone = "mint" }: { label: string; value: string | number; unit?: string; delta?: string; tone?: "mint" | "cyan" | "amber" | "red" }) {
  const colors = { mint: "text-mint", cyan: "text-cyan", amber: "text-amber-400", red: "text-red-400" };
  return <div className="card p-5">
    <div className="label">{label}</div>
    <div className="mt-3 flex items-end gap-1.5"><span className={`text-2xl font-bold tabular-nums ${colors[tone]}`}>{value}</span><span className="mb-1 text-xs text-slate-500">{unit}</span></div>
    {delta && <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">{delta.startsWith("+") ? <ArrowUpRight size={13} className="text-mint" /> : <ArrowDownRight size={13} className="text-amber-400" />}{delta} vs previous period</div>}
  </div>;
}

export function Status({ value }: { value: string }) {
  const tone = /healthy|online|active|succeeded|delivered|resolved/i.test(value) ? "bg-mint/10 text-mint border-mint/20" :
    /critical|offline|high|failed|open/i.test(value) ? "bg-red-400/10 text-red-400 border-red-400/20" :
    /warning|investigating|medium|retry/i.test(value) ? "bg-amber-400/10 text-amber-300 border-amber-400/20" : "bg-cyan/10 text-cyan border-cyan/20";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{value}</span>;
}

export function Loading() {
  return <div className="space-y-4">{[1,2,3].map(x => <div key={x} className="card h-24 animate-pulse bg-white/[.04]" />)}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="card border-red-400/20 p-8 text-center"><div className="text-red-400">Unable to reach the Guardian API</div><div className="mt-2 text-sm text-slate-500">{message}. Start the backend on port 8000, then refresh.</div></div>;
}
