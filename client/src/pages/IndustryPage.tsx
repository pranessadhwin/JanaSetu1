import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getIndustryPartners, getProjects } from "../services/api.js";
import { CATEGORIES } from "../constants.js";
import { Card, StageBadge, Tag, inputCls, btnSecondary, Empty } from "../components/UI.js";

export function IndustryPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [pts, prs] = await Promise.all([
          getIndustryPartners(),
          getProjects(),
        ]);
        setPartners(pts);
        setProjects(prs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProjects = selectedCategory
    ? projects.filter((p) => p.category === selectedCategory)
    : projects;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Industry Collaboration Exchange</h1>
        <p className="text-sm text-slate-600">
          Browse university projects needing funding, mentorship, equipment, manufacturing or CSR support — and turn early prototypes into deployment-ready products.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`${inputCls} !w-auto`}
        >
          <option value="">All domains</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {selectedCategory && (
          <button onClick={() => setSelectedCategory("")} className={btnSecondary}>
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <Empty>No projects found in this domain.</Empty>
          ) : (
            filteredProjects.map((p) => (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link to={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.university?.shortName || "University"} · {p.category}
                    </p>
                  </div>
                  <StageBadge stage={p.stage} />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span>Cost estimate: <strong>₹{p.costLakh} lakh</strong></span>
                  <span>Impact: <strong>{p.impactLevel}</strong></span>
                  <span>Scalability: <strong>{p.scalabilityLevel}</strong></span>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link to={`/projects/${p.id}`} className={btnSecondary}>
                    View project &amp; express interest →
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card title="Registered Industry Partners">
            <ul className="space-y-3">
              {partners.map((pt) => (
                <li key={pt.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-900">{pt.name}</p>
                  <p className="text-xs text-slate-500">{pt.sector} · {pt.district}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.isArray(pt.offerings) && pt.offerings.map((o: string) => <Tag key={o}>{o}</Tag>)}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="What Industry Adds">
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li>• Precision sensors, enclosures &amp; field testing</li>
              <li>• Durable, safe and certified manufacturing</li>
              <li>• Distribution channels and supply chains</li>
              <li>• Technical mentorship and CSR sponsorship</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              A university prototype proves an idea works. An industry partnership scales it reliably to thousands of citizens.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
