import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";

export const STAGES = [
  "submitted",
  "validated",
  "categorized",
  "assigned",
  "proposal_created",
  "industry_connected",
  "prototype",
  "pilot",
  "deployed",
  "impact_evaluation",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  submitted: "Submitted",
  validated: "Validated",
  categorized: "Categorized",
  assigned: "Assigned to University",
  proposal_created: "Proposal Created",
  industry_connected: "Industry Connected",
  prototype: "Prototype Developed",
  pilot: "Pilot Testing",
  deployed: "Deployed",
  impact_evaluation: "Impact Evaluation",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 ring-red-200",
    High: "bg-orange-100 text-orange-800 ring-orange-200",
    Medium: "bg-amber-100 text-amber-800 ring-amber-200",
    Low: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${map[priority] ?? map.Low}`}>{priority}</span>;
}

export function StageBadge({ stage }: { stage: string }) {
  const label = STAGE_LABELS[stage as Stage] ?? stage;
  const idx = STAGES.indexOf(stage as Stage);
  const tone = idx >= 8 ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : idx >= 3 ? "bg-blue-100 text-blue-800 ring-blue-200" : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}>{label}</span>;
}

export function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = { High: "bg-emerald-50 text-emerald-700 ring-emerald-200", Medium: "bg-amber-50 text-amber-700 ring-amber-200", Low: "bg-slate-50 text-slate-600 ring-slate-200" };
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ring-1 ${map[level] ?? map.Medium}`}>{level}</span>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{children}</span>;
}

export function Card({ children, className = "", title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function StageTimeline({ current, history }: { current: string; history?: { stage: string; createdAt: string | Date; note: string; responsibleParty: string }[] }) {
  const curIdx = STAGES.indexOf(current as Stage);
  return (
    <ol className="space-y-3">
      {STAGES.map((s, i) => {
        const h = history?.filter((x) => x.stage === s).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const done = i <= curIdx;
        const active = i === curIdx;
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-0.5 h-3.5 w-3.5 rounded-full ring-4 ${active ? "bg-emerald-600 ring-emerald-100" : done ? "bg-emerald-500 ring-white" : "bg-slate-200 ring-white"}`} />
              {i < STAGES.length - 1 && <span className={`w-px flex-1 ${i < curIdx ? "bg-emerald-300" : "bg-slate-200"}`} />}
            </div>
            <div className="pb-2">
              <p className={`text-sm ${done ? "font-medium text-slate-900" : "text-slate-400"}`}>{STAGE_LABELS[s]}</p>
              {h && (
                <p className="text-xs text-slate-500">
                  {fmtDate(h.createdAt)} · {h.responsibleParty}
                  {h.note && <span className="block text-slate-600">{h.note}</span>}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">{children}</p>;
}

export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
export const btnPrimary = "inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 cursor-pointer";
export const btnSecondary = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link to={href} className="text-sm text-slate-500 hover:text-slate-800">← {children}</Link>;
}

export function fmtDate(d: string | Date | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
