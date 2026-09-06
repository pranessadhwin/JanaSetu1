import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PriorityBadge, StageBadge, Stat } from "../components/UI.js";
import { getDashboardMetrics, getChallenges, getProjects } from "../services/api.js";

const steps = [
  ["Report", "Citizens, NGOs, Panchayats and departments report a problem with text, voice, photo, video and location."],
  ["Analyse", "The problem is classified, grouped with similar reports nearby, and given an explainable priority level."],
  ["Match", "Universities with the right departments, faculty, labs and proximity are shortlisted with reasons."],
  ["Propose", "The accepted university refines an AI-drafted proposal; government reviews impact, feasibility, cost and scale."],
  ["Build & Pilot", "Industry partners add funding, equipment and manufacturing know-how; the solution is piloted in 2–3 villages."],
  ["Deploy & Measure", "Deployment is tracked and outcomes are measured before and after — people benefited, hours of service, shortage days."],
];

export function HomePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentChallenges, setRecentChallenges] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dash, challenges, projects] = await Promise.all([
          getDashboardMetrics().catch(() => null),
          getChallenges().catch(() => []),
          getProjects().catch(() => []),
        ]);
        setMetrics(dash?.summary || null);
        setRecentChallenges((challenges || []).slice(0, 5));
        setActiveProjects((projects || []).slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 px-6 py-12 text-white sm:px-10 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Societal Innovation Exchange · Jharkhand</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">From a citizen&apos;s report to a solution that is built, piloted and measured.</h1>
        <p className="mt-4 max-w-2xl text-emerald-100">
          JharVikas connects citizens, universities, industry and government in one pipeline — so a village handpump that dries up every summer becomes a research project, a prototype, a pilot and finally a deployed solution whose impact is verified.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/challenges/new" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 transition-colors shadow-sm">
            Report a Problem
          </Link>
          <Link to="/challenges" className="rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors">
            Browse Challenges
          </Link>
          <Link to="/dashboard" className="rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors">
            Government Dashboard
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Challenges reported" value={metrics?.totalChallenges ?? (loading ? "..." : 17)} />
        <Stat label="Problem clusters" value={metrics?.totalClusters ?? (loading ? "..." : 3)} />
        <Stat label="Projects" value={metrics?.totalProjects ?? (loading ? "..." : 3)} />
        <Stat label="Universities" value={metrics?.totalUniversities ?? (loading ? "..." : 7)} />
        <Stat label="Industry partners" value={metrics?.totalIndustryPartners ?? (loading ? "..." : 7)} />
        <Stat
          label="People benefited"
          value={(metrics?.totalPopulationAffected ?? 27000).toLocaleString("en-IN")}
          hint={`${metrics?.pilotsDeployed ?? 2} deployed project(s)`}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">How a problem becomes a solution</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([t, d], idx) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-200 transition-colors">
              <p className="text-xs font-semibold text-emerald-700">Step {idx + 1}</p>
              <p className="mt-1 font-semibold text-slate-900">{t}</p>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent challenges" action={<Link to="/challenges" className="text-sm text-emerald-700 hover:underline">View all</Link>}>
          <ul className="divide-y divide-slate-100">
            {recentChallenges.map((ch) => (
              <li key={ch.id} className="py-3">
                <Link to={`/challenges/${ch.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                  {ch.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <PriorityBadge priority={ch.priority} />
                  <span>{ch.category} · {Array.isArray(ch.subTags) ? ch.subTags[0] : ch.category}</span>
                  <span>· {ch.village ? `${ch.village}, ` : ""}{ch.district}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Projects in progress" action={<Link to="/projects" className="text-sm text-emerald-700 hover:underline">View all</Link>}>
          <ul className="divide-y divide-slate-100">
            {activeProjects.map((pr) => (
              <li key={pr.id} className="py-3">
                <Link to={`/projects/${pr.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                  {pr.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <StageBadge stage={pr.stage} />
                  <span>{pr.university?.shortName || "University Team"}</span>
                  <span>· {pr.category}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
