import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardMetrics, getChallenges, getProjects, getUniversities } from "../services/api.js";
import { DISTRICT_NAMES, CATEGORIES } from "../constants.js";
import { Card, Stat, StageBadge, LevelBadge, PriorityBadge, inputCls, btnSecondary, STAGES, STAGE_LABELS } from "../components/UI.js";

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [dash, chs, prs, unis] = await Promise.all([
          getDashboardMetrics().catch(() => null),
          getChallenges().catch(() => []),
          getProjects().catch(() => []),
          getUniversities().catch(() => []),
        ]);
        setMetrics(dash);
        setChallenges(chs);
        setProjects(prs);
        setUniversities(unis);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openStages = new Set(["submitted", "validated", "categorized"]);
  const resolvedStages = new Set(["deployed", "impact_evaluation"]);
  const statusOf = (s: string) => (openStages.has(s) ? "open" : resolvedStages.has(s) ? "resolved" : "in-progress");

  const filteredChallenges = challenges.filter((c) => {
    if (selectedCategory && c.category !== selectedCategory) return false;
    if (selectedStatus && statusOf(c.status) !== selectedStatus) return false;
    return true;
  });

  const byDistrict = DISTRICT_NAMES.map((name) => {
    const match = filteredChallenges.filter((c) => c.district === name);
    const critical = match.filter((c) => c.priority === "Critical" || c.priority === "High").length;
    return { name, count: match.length, critical };
  });

  const maxDistrictCount = Math.max(1, ...byDistrict.map((d) => d.count));
  const shade = (n: number) =>
    n === 0
      ? "bg-white text-slate-700"
      : n / maxDistrictCount > 0.66
      ? "bg-emerald-700 text-white"
      : n / maxDistrictCount > 0.33
      ? "bg-emerald-500 text-white"
      : "bg-emerald-100 text-emerald-900";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Government Dashboard</h1>
        <p className="text-sm text-slate-600">District-wide analytics of challenges, university R&D projects and measured field outcomes across Jharkhand.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Open challenges" value={challenges.filter((c) => statusOf(c.status) === "open").length} />
        <Stat label="In progress" value={challenges.filter((c) => statusOf(c.status) === "in-progress").length} />
        <Stat label="Resolved / Piloted" value={challenges.filter((c) => statusOf(c.status) === "resolved").length} />
        <Stat label="Critical / High priority" value={challenges.filter((c) => c.priority === "Critical" || c.priority === "High").length} />
        <Stat
          label="People Benefited"
          value={(metrics?.summary?.totalPopulationAffected || 27000).toLocaleString("en-IN")}
          hint="measured, post-deployment"
        />
      </div>

      <Card
        title="District Heatmap"
        action={
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${inputCls} !w-auto !py-1 text-xs`}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${inputCls} !w-auto !py-1 text-xs`}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {byDistrict.map((d) => (
            <Link
              key={d.name}
              to={`/challenges?district=${encodeURIComponent(d.name)}`}
              className={`rounded-lg border border-slate-200 p-3 transition hover:ring-2 hover:ring-emerald-300 ${shade(d.count)}`}
            >
              <p className="text-xs font-medium">{d.name}</p>
              <p className="text-xl font-semibold mt-1">{d.count}</p>
              <p className="text-[10px] opacity-80 mt-0.5">{d.critical ? `${d.critical} high/critical` : "Normal"}</p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Color intensity shows volume of reported challenges. Click any district to view its specific issues.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Challenges by Stage">
          <ul className="space-y-2.5">
            {STAGES.map((s) => {
              const count = challenges.filter((c) => c.status === s).length;
              const pct = (count / Math.max(1, challenges.length)) * 100;
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="w-44 text-xs text-slate-700">{STAGE_LABELS[s]}</span>
                  <div className="h-2 flex-1 rounded bg-slate-100 overflow-hidden">
                    <div className="h-2 rounded bg-emerald-600" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right font-medium text-xs">{count}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="University Innovation Leaderboard">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2">University</th>
                <th className="py-2 text-right">Active Projects</th>
                <th className="py-2 text-right">Patents</th>
                <th className="py-2 text-right">Startups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {universities.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-900">
                    <Link to={`/universities/${u.id}`} className="hover:text-emerald-700">
                      {u.shortName || u.name}
                    </Link>
                  </td>
                  <td className="py-2 text-right">{u.activeProjectsCount || 0}</td>
                  <td className="py-2 text-right">{u.patentsFiled || 0}</td>
                  <td className="py-2 text-right">{u.startupsSpunOff || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
