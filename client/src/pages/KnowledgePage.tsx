import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getKnowledgeBase } from "../services/api.js";
import { Card, Tag, inputCls, btnPrimary } from "../components/UI.js";

export function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const loadData = async (query?: string) => {
    setLoading(true);
    try {
      const data = await getKnowledgeBase(query ? { q: query } : undefined);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(q);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Innovation Graph &amp; Knowledge Base</h1>
        <p className="text-sm text-slate-600">
          Search previous research, verified pilots and rural case studies across Jharkhand to reuse proven engineering designs instead of starting from scratch.
        </p>
      </div>

      <Card title="Search Innovation Library">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search keywords (e.g. rainwater harvesting, fluoride filtration, solar IoT)…"
            className={`${inputCls} flex-1`}
          />
          <button type="submit" className={btnPrimary}>Search</button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="sm:col-span-2 p-8 text-center text-slate-500">Loading case studies...</div>
        ) : items.length === 0 ? (
          <div className="sm:col-span-2 p-8 text-center text-slate-500">No knowledge records match your search.</div>
        ) : (
          items.map((k) => (
            <Card key={k.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {k.type}
                </span>
                <span className="text-xs text-slate-500">{k.category}</span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-slate-900">{k.title}</h2>
              <p className="mt-1 text-xs text-slate-500">Source: {k.source} {k.costLakh && `· Approx ₹${k.costLakh} lakh`}</p>
              <p className="mt-2 text-sm text-slate-700">{k.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {Array.isArray(k.tags) && k.tags.map((t: string) => <Tag key={t}>{t}</Tag>)}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
