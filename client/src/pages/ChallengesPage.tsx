import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChallenges } from "../services/api.js";
import { CATEGORIES, DISTRICT_NAMES } from "../constants.js";
import { Card, PriorityBadge, StageBadge, inputCls, btnSecondary, fmtDate } from "../components/UI.js";

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getChallenges();
        setChallenges(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = challenges.filter((c) => {
    if (category && c.category !== category) return false;
    if (district && c.district !== district) return false;
    if (priority && c.priority !== priority) return false;
    if (q) {
      const search = q.toLowerCase();
      const text = `${c.title} ${c.description} ${c.village} ${c.block}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });

  const handleReset = () => {
    setQ("");
    setCategory("");
    setDistrict("");
    setPriority("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Challenges</h1>
          <p className="text-sm text-slate-600">Problems reported by citizens, NGOs, Panchayats and departments — classified, clustered and prioritised.</p>
        </div>
        <Link to="/challenges/new" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors shadow-sm">
          Report a Problem
        </Link>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className={inputCls}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls}>
            <option value="">All districts</option>
            {DISTRICT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
            <option value="">All priorities</option>
            {["Critical", "High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={handleReset} className={btnSecondary}>
              Reset
            </button>
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Challenge</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading challenges from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No challenges match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/challenges/${c.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                        {c.title}
                      </Link>
                      <p className="text-xs text-slate-500">{c.reporterType}: {c.reporterName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.category}
                      <p className="text-xs text-slate-500">{Array.isArray(c.subTags) ? c.subTags[0] : c.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.village || c.block || "District-wide"}
                      <p className="text-xs text-slate-500">{c.district}</p>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StageBadge stage={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(c.createdAt)}</td>
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
