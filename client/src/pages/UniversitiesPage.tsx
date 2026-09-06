import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUniversities } from "../services/api.js";
import { Card, Tag } from "../components/UI.js";

export function UniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUniversities();
        setUniversities(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Universities</h1>
        <p className="text-sm text-slate-600">
          Partner institutions, their technical expertise, and their track record — measured in challenges solved, active projects, patents and startups.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">University</th>
                <th className="px-4 py-3">Active Projects</th>
                <th className="px-4 py-3">Faculty Mentors</th>
                <th className="px-4 py-3">Students Enrolled</th>
                <th className="px-4 py-3">Patents</th>
                <th className="px-4 py-3">Startups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading institutions...
                  </td>
                </tr>
              ) : universities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No universities found.
                  </td>
                </tr>
              ) : (
                universities.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/universities/${u.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                        {u.name}
                      </Link>
                      <p className="text-xs text-slate-500">{u.district}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.activeProjectsCount || 0}</td>
                    <td className="px-4 py-3 text-slate-700">{u.facultyCount || 0}</td>
                    <td className="px-4 py-3 text-slate-700">{u.studentCount || 0}</td>
                    <td className="px-4 py-3 text-slate-700">{u.patentsFiled || 0}</td>
                    <td className="px-4 py-3 text-slate-700">{u.startupsSpunOff || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {universities.map((u) => (
          <Card key={u.id}>
            <Link to={`/universities/${u.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
              {u.name}
            </Link>
            <p className="mt-1 text-sm text-slate-600">{u.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {Array.isArray(u.expertiseTags) && u.expertiseTags.map((t: string) => <Tag key={t}>{t}</Tag>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
