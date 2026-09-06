import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProjectById,
  updateProjectStage,
  saveProposal,
  draftAIProposal,
  addMilestone,
  toggleMilestone,
  postProjectMessage,
  addCollaboration,
  recordProjectImpact,
} from "../services/api.js";
import {
  Card,
  StageBadge,
  StageTimeline,
  LevelBadge,
  Tag,
  BackLink,
  inputCls,
  btnPrimary,
  btnSecondary,
  fmtDate,
  Empty,
  STAGES,
  STAGE_LABELS,
  type Stage,
} from "../components/UI.js";

const PROPOSAL_FIELDS = [
  ["problemStatement", "Problem statement"],
  ["proposedSolution", "Proposed solution"],
  ["requiredTeam", "Required team"],
  ["methodology", "Methodology"],
  ["timeline", "Timeline"],
  ["budget", "Budget"],
  ["expectedOutcomes", "Expected outcomes"],
  ["impactIndicators", "Impact indicators"],
  ["risks", "Risks and constraints"],
] as const;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Proposal edit state
  const [proposalData, setProposalData] = useState<Record<string, string>>({});
  const [savingProposal, setSavingProposal] = useState(false);
  const [draftingAI, setDraftingAI] = useState(false);

  // Stage advance state
  const [stageNote, setStageNote] = useState("");
  const [responsibleParty, setResponsibleParty] = useState("University Team");

  // Milestone input
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDue, setNewMilestoneDue] = useState("");

  // Chat input
  const [chatAuthor, setChatAuthor] = useState("Team Member");
  const [chatRole, setChatRole] = useState("Team");
  const [chatText, setChatText] = useState("");

  // Industry connection input
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [supportType, setSupportType] = useState("Funding");
  const [collabNote, setCollabNote] = useState("");

  // Impact input
  const [impactIndicator, setImpactIndicator] = useState("");
  const [impactUnit, setImpactUnit] = useState("");
  const [impactBefore, setImpactBefore] = useState("");
  const [impactAfter, setImpactAfter] = useState("");
  const [impactNote, setImpactNote] = useState("");

  const reload = async () => {
    if (!id) return;
    try {
      const res = await getProjectById(id);
      setData(res);
      if (res.proposal) {
        setProposalData(res.proposal);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading project workspace...</div>;
  }

  if (!data || !data.project) {
    return (
      <div className="space-y-4">
        <BackLink href="/projects">All projects</BackLink>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Project not found.</div>
      </div>
    );
  }

  const {
    project: p,
    challenge: c,
    university: u,
    proposal: prop,
    milestones,
    stageHistory,
    messages,
    collaborations,
    impactRecords,
    availableIndustryPartners,
  } = data;

  const stageIdx = STAGES.indexOf(p.stage as Stage);
  const nextStage = STAGES[stageIdx + 1] as Stage | undefined;

  const handleAdvanceStage = async () => {
    if (!nextStage || !id) return;
    try {
      await updateProjectStage(id, {
        stage: nextStage,
        note: stageNote || `Moved to ${STAGE_LABELS[nextStage]}`,
        responsibleParty,
      });
      setStageNote("");
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingProposal(true);
    try {
      await saveProposal(id, proposalData);
      reload();
      alert("Proposal saved successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingProposal(false);
    }
  };

  const handleAIDraft = async () => {
    if (!id) return;
    setDraftingAI(true);
    try {
      const res = await draftAIProposal(id);
      setProposalData(res);
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDraftingAI(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle || !id) return;
    try {
      await addMilestone(id, { title: newMilestoneTitle, dueDate: newMilestoneDue });
      setNewMilestoneTitle("");
      setNewMilestoneDue("");
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleMilestone = async (mId: number, done: boolean) => {
    if (!id) return;
    try {
      await toggleMilestone(id, mId, done);
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText || !id) return;
    try {
      await postProjectMessage(id, { author: chatAuthor, role: chatRole, body: chatText });
      setChatText("");
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || !id) return;
    try {
      await addCollaboration(id, {
        industryPartnerId: Number(selectedPartnerId),
        supportType,
        note: collabNote,
      });
      setSelectedPartnerId("");
      setCollabNote("");
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddImpact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impactIndicator || !id) return;
    try {
      await recordProjectImpact(id, {
        indicator: impactIndicator,
        unit: impactUnit,
        beforeValue: impactBefore,
        afterValue: impactAfter,
        note: impactNote,
      });
      setImpactIndicator("");
      setImpactUnit("");
      setImpactBefore("");
      setImpactAfter("");
      setImpactNote("");
      reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink href="/projects">All projects</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={p.stage} />
            <Tag>{p.category}</Tag>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{p.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {u ? (
              <Link to={`/universities/${u.id}`} className="font-medium text-emerald-700 hover:underline">
                {u.name}
              </Link>
            ) : (
              "University Workspace"
            )}
            {" · "}
            Challenge:{" "}
            {c ? (
              <Link to={`/challenges/${c.id}`} className="hover:underline">
                {c.title}
              </Link>
            ) : (
              "Linked Problem"
            )}
          </p>
        </div>

        {nextStage && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-xs">
            <input
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
              placeholder={`Note for "${STAGE_LABELS[nextStage]}"`}
              className={`${inputCls} !w-52 !py-1.5 text-xs`}
            />
            <select
              value={responsibleParty}
              onChange={(e) => setResponsibleParty(e.target.value)}
              className={`${inputCls} !w-auto !py-1.5 text-xs`}
            >
              {[u?.shortName || "University", "Industry Partner", "Government Admin", "Platform"].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
            <button onClick={handleAdvanceStage} className={btnPrimary}>
              Move to: {STAGE_LABELS[nextStage]}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Proposal Editor */}
          <Card
            title="Proposal & Methodology"
            action={
              <button onClick={handleAIDraft} disabled={draftingAI} className={btnSecondary}>
                {draftingAI ? "Drafting with AI..." : "✨ Regenerate with AI"}
              </button>
            }
          >
            <p className="mb-4 text-xs text-slate-500">
              The first draft is generated automatically from challenge data and past case studies. Edit fields below to tailor the proposal.
            </p>
            <form onSubmit={handleSaveProposal} className="space-y-4">
              {PROPOSAL_FIELDS.map(([k, label]) => (
                <div key={k}>
                  <label className="mb-1 block text-sm font-medium text-slate-800">{label}</label>
                  <textarea
                    value={proposalData[k] ?? ""}
                    onChange={(e) => setProposalData({ ...proposalData, [k]: e.target.value })}
                    rows={3}
                    className={`${inputCls} font-normal`}
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <button type="submit" disabled={savingProposal} className={btnPrimary}>
                  {savingProposal ? "Saving..." : "Save Proposal Changes"}
                </button>
              </div>
            </form>
          </Card>

          {/* Industry Collaborations */}
          <Card title="Industry & CSR Support">
            {collaborations.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {collaborations.map((col: any) => (
                  <li key={col.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{col.partner?.name || "Industry Partner"}</p>
                      <p className="text-xs text-slate-500">
                        Type: <span className="font-medium text-slate-700">{col.supportType}</span> · {col.note}
                      </p>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Active Linkage
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No industry partner linked yet.</Empty>
            )}

            <form onSubmit={handleAddCollab} className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-slate-100 pt-4">
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select Industry Partner</option>
                {(availableIndustryPartners || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                ))}
              </select>
              <select value={supportType} onChange={(e) => setSupportType(e.target.value)} className={inputCls}>
                {["Funding", "Mentorship", "Equipment", "CSR Support", "Manufacturing"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                value={collabNote}
                onChange={(e) => setCollabNote(e.target.value)}
                placeholder="Commitment details (e.g. ₹6L grant)"
                className={inputCls}
              />
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" className={btnSecondary}>+ Connect Partner</button>
              </div>
            </form>
          </Card>

          {/* Impact Measurement */}
          <Card title="Impact Metrics & Baseline Verification">
            {impactRecords.length > 0 ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3">Indicator</th>
                      <th className="py-2 px-3">Baseline (Before)</th>
                      <th className="py-2 px-3">Pilot Result (After)</th>
                      <th className="py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {impactRecords.map((rec: any) => (
                      <tr key={rec.id}>
                        <td className="py-2 px-3 font-medium text-slate-900">{rec.indicator}</td>
                        <td className="py-2 px-3">{rec.beforeValue} {rec.unit}</td>
                        <td className="py-2 px-3 text-emerald-700 font-semibold">{rec.afterValue} {rec.unit}</td>
                        <td className="py-2 px-3 text-slate-500">{rec.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No impact data recorded yet. Add indicators before and during the pilot.</Empty>
            )}

            <form onSubmit={handleAddImpact} className="grid gap-2 sm:grid-cols-4 border-t border-slate-100 pt-3 text-xs">
              <input value={impactIndicator} onChange={(e) => setImpactIndicator(e.target.value)} placeholder="Indicator (e.g. Daily hours of water)" required className={inputCls} />
              <input value={impactUnit} onChange={(e) => setImpactUnit(e.target.value)} placeholder="Unit (e.g. hours/day)" className={inputCls} />
              <input type="number" step="any" value={impactBefore} onChange={(e) => setImpactBefore(e.target.value)} placeholder="Before" className={inputCls} />
              <input type="number" step="any" value={impactAfter} onChange={(e) => setImpactAfter(e.target.value)} placeholder="After" className={inputCls} />
              <div className="sm:col-span-4 flex justify-end">
                <button type="submit" className={btnSecondary}>+ Log Metric</button>
              </div>
            </form>
          </Card>

          {/* Team Message Board */}
          <Card title="Team Discussion & Field Notes">
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <Empty>No messages yet. Post field notes or queries below.</Empty>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{m.author} ({m.role})</span>
                      <span>{fmtDate(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-slate-700 text-xs">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Post an update or field question…"
                className={inputCls}
              />
              <button type="submit" className={btnPrimary}>Post</button>
            </form>
          </Card>
        </div>

        {/* Sidebar: Pipeline & Milestones */}
        <div className="space-y-6">
          <Card title="Project Milestones">
            <div className="space-y-2 mb-4">
              {milestones.length === 0 ? (
                <Empty>No milestones added yet.</Empty>
              ) : (
                milestones.map((m: any) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(m.done)}
                      onChange={(e) => handleToggleMilestone(m.id, e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={m.done ? "line-through text-slate-400" : ""}>{m.title}</span>
                    {m.dueDate && <span className="text-xs text-slate-400 ml-auto">Due: {m.dueDate}</span>}
                  </label>
                ))
              )}
            </div>
            <form onSubmit={handleAddMilestone} className="space-y-2 border-t border-slate-100 pt-3">
              <input
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="New milestone..."
                required
                className={inputCls}
              />
              <div className="flex gap-2">
                <input
                  value={newMilestoneDue}
                  onChange={(e) => setNewMilestoneDue(e.target.value)}
                  placeholder="Due date/week"
                  className={inputCls}
                />
                <button type="submit" className={btnSecondary}>Add</button>
              </div>
            </form>
          </Card>

          <Card title="Audit Pipeline">
            <StageTimeline current={p.stage} history={stageHistory} />
          </Card>
        </div>
      </div>
    </div>
  );
}
