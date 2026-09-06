import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects } from "../services/api.js";
import { STAGES, STAGE_LABELS, StageBadge, LevelBadge, fmtDate } from "../components/UI.js";

export function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = STAGES.map((s) => ({ s, n: projects.filter((p) => p.stage === s).length }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="text-sm text-slate-600">Every challenge that has been assigned to a university, tracked from proposal to measured impact.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {counts.map(({ s, n }) => (
          <div key={s} className={`min-w-[120px] rounded-lg border px-3 py-2 ${n ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <p className="text-lg font-semibold text-slate-900">{n}</p>
            <p className="text-xs text-slate-600">{STAGE_LABELS[s]}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">University</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Impact</th>
                <th className="px-4 py-3">Feasibility</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Scalability</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No projects yet. Assign a university from a challenge page.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${p.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                        {p.title}
                      </Link>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.university?.shortName || p.university?.name || "Assigned Institute"}</td>
                    <td className="px-4 py-3"><StageBadge stage={p.stage} /></td>
                    <td className="px-4 py-3"><LevelBadge level={p.impactLevel} /></td>
                    <td className="px-4 py-3"><LevelBadge level={p.feasibilityLevel} /></td>
                    <td className="px-4 py-3 text-slate-700">₹{p.costLakh} lakh</td>
                    <td className="px-4 py-3"><LevelBadge level={p.scalabilityLevel} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(p.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
