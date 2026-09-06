import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUniversityById } from "../services/api.js";
import { Card, Tag, StageBadge, BackLink, Empty } from "../components/UI.js";

export function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await getUniversityById(id);
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading university profile...</div>;
  }

  if (!data || !data.university) {
    return (
      <div className="space-y-4">
        <BackLink href="/universities">All universities</BackLink>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">University not found.</div>
      </div>
    );
  }

  const { university: u, people = [], projects = [] } = data;

  return (
    <div className="space-y-6">
      <BackLink href="/universities">All universities</BackLink>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{u.name}</h1>
        <p className="text-sm text-slate-600">{u.district} · {u.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Active Projects & R&D Assignments">
            {projects.length === 0 ? (
              <Empty>No assigned projects currently.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {projects.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link to={`/projects/${p.id}`} className="text-sm font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                        {p.title}
                      </Link>
                      {p.challenge && <p className="text-xs text-slate-500 mt-0.5">Problem: {p.challenge.title}</p>}
                    </div>
                    <StageBadge stage={p.stage} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Faculty Mentors & Student Innovators">
            <div className="grid gap-3 sm:grid-cols-2">
              {people.map((p: any) => (
                <div key={p.id} className="rounded-lg border border-slate-100 p-3 bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">
                    {p.name} <span className="text-xs font-normal text-slate-500">· {p.role === "faculty" ? "Faculty" : "Student"}</span>
                  </p>
                  <p className="text-xs text-slate-500">{p.department}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.isArray(p.skills) && p.skills.map((s: string) => <Tag key={s}>{s}</Tag>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Departments">
            <div className="flex flex-wrap gap-1">
              {Array.isArray(u.departments) && u.departments.map((d: string) => <Tag key={d}>{d}</Tag>)}
            </div>
          </Card>

          <Card title="Core Expertise Tags">
            <div className="flex flex-wrap gap-1">
              {Array.isArray(u.expertiseTags) && u.expertiseTags.map((d: string) => <Tag key={d}>{d}</Tag>)}
            </div>
          </Card>

          <Card title="Specialized Laboratories">
            <ul className="space-y-1.5 text-sm text-slate-700">
              {Array.isArray(u.labs) && u.labs.map((l: string) => <li key={l}>• {l}</li>)}
            </ul>
          </Card>

          <Card title="Past Field Projects">
            <ul className="space-y-1.5 text-sm text-slate-700">
              {Array.isArray(u.pastProjects) && u.pastProjects.map((l: string) => <li key={l}>• {l}</li>)}
            </ul>
          </Card>

          <Card title="Innovation Track Record">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Patents filed</dt>
                <dd className="font-semibold text-lg text-slate-900">{u.patentsFiled}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Startups spun off</dt>
                <dd className="font-semibold text-lg text-slate-900">{u.startupsSpunOff}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
