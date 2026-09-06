import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getChallengeById, assignChallenge } from "../services/api.js";
import { Card, PriorityBadge, StageBadge, Tag, StageTimeline, BackLink, btnSecondary, btnPrimary, fmtDate, Empty } from "../components/UI.js";

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await getChallengeById(id);
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading challenge details...</div>;
  }

  if (!data || !data.challenge) {
    return (
      <div className="space-y-4">
        <BackLink href="/challenges">All challenges</BackLink>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Challenge not found.
        </div>
      </div>
    );
  }

  const { challenge: c, cluster, clusterMembers, universityResponses, stageHistory, notifications, project } = data;
  const siblings = (clusterMembers || []).filter((m: any) => m.id !== c.id);

  const handleAssign = async (universityId: number) => {
    if (!id) return;
    setAssigning(universityId);
    try {
      const res = await assignChallenge(id, { universityId });
      if (res.projectId) {
        navigate(`/projects/${res.projectId}`);
      } else {
        const reloaded = await getChallengeById(id);
        setData(reloaded);
      }
    } catch (err: any) {
      alert("Error assigning: " + err.message);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink href="/challenges">All challenges</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={c.priority} />
            <StageBadge stage={c.status} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{c.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {c.village && `${c.village}, `}{c.block && `${c.block} block, `}{c.district} · Reported {fmtDate(c.createdAt)} by {c.reporterName} ({c.reporterType})
          </p>
        </div>
        {project && (
          <Link to={`/projects/${project.id}`} className={btnPrimary}>
            Open project workspace →
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Citizen report">
            <p className="whitespace-pre-line text-slate-800">{c.description}</p>
            {Array.isArray(c.attachments) && c.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.attachments.map((a: string) => <Tag key={a}>📎 {a}</Tag>)}
              </div>
            )}
            {c.lat && c.lng && (
              <p className="mt-3 text-xs text-slate-500">GPS: {Number(c.lat).toFixed(4)}, {Number(c.lng).toFixed(4)}</p>
            )}
          </Card>

          <Card title="Analysis">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{c.category} → {Array.isArray(c.subTags) ? c.subTags.join(" · ") : c.category}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">People affected</dt>
                <dd className="font-medium text-slate-900">{(c.affectedPopulation || 0).toLocaleString("en-IN")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Frequency</dt>
                <dd className="font-medium capitalize text-slate-900">{c.frequency}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Alternative source</dt>
                <dd className="font-medium text-slate-900">{c.hasAlternative ? "Exists (inadequate)" : "None available"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Vulnerable groups</dt>
                <dd className="flex flex-wrap gap-1">
                  {Array.isArray(c.vulnerableGroups) && c.vulnerableGroups.length ? (
                    c.vulnerableGroups.map((g: string) => <Tag key={g}>{g}</Tag>)
                  ) : (
                    <span className="text-sm text-slate-400">None identified</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Urgency signals</dt>
                <dd className="flex flex-wrap gap-1">
                  {Array.isArray(c.urgencyKeywords) && c.urgencyKeywords.length ? (
                    c.urgencyKeywords.map((g: string) => <Tag key={g}>{g}</Tag>)
                  ) : (
                    <span className="text-sm text-slate-400">None detected</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Why priority is <PriorityBadge priority={c.priority} />
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {Array.isArray(c.priorityReasons) && c.priorityReasons.map((r: string) => <li key={r}>{r}</li>)}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Priority combines affected population, urgency, absence of alternatives, vulnerable groups and geographic spread using fixed explainable rules.
              </p>
            </div>
          </Card>

          <Card title={`Similar reports${cluster ? ` · ${cluster.title}` : ""}`}>
            {siblings.length === 0 ? (
              <Empty>No similar reports nearby yet. New reports within ~90 km will be grouped here automatically.</Empty>
            ) : (
              <>
                <p className="mb-3 text-sm text-slate-700">
                  <strong>{siblings.length}</strong> other location(s) in this cluster.
                </p>
                <ul className="divide-y divide-slate-100 text-sm">
                  {siblings.map((s: any) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <Link to={`/challenges/${s.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                          {s.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {s.village}, {s.district} · {(s.affectedPopulation || 0).toLocaleString("en-IN")} people
                        </p>
                      </div>
                      <PriorityBadge priority={s.priority} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title="Matched universities">
            <p className="mb-4 text-sm text-slate-600">
              Shortlisted by department, faculty research, laboratories, past projects and proximity.
            </p>
            {(!universityResponses || universityResponses.length === 0) ? (
              <Empty>No university responses yet.</Empty>
            ) : (
              <div className="space-y-4">
                {universityResponses.map((r: any) => (
                  <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-slate-900">
                        {r.university?.name || `University #${r.universityId}`}
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 capitalize">
                        {r.status}
                      </span>
                    </div>
                    {Array.isArray(r.matchReasons) && r.matchReasons.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-0.5">
                        {r.matchReasons.map((m: string) => <li key={m}>{m}</li>)}
                      </ul>
                    )}
                    {!project && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAssign(r.universityId)}
                          disabled={assigning === r.universityId}
                          className={btnSecondary}
                        >
                          {assigning === r.universityId ? "Assigning..." : "Assign to this University"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Pipeline status">
            <StageTimeline current={c.status} history={stageHistory} />
          </Card>

          <Card title="Citizen updates">
            <ul className="space-y-3 text-sm">
              {(notifications || []).map((n: any) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-slate-700 text-xs">
                  <p className="font-medium text-slate-900">{n.message}</p>
                  <p className="mt-1 text-slate-400">{fmtDate(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
