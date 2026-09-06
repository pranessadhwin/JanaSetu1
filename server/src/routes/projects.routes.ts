import { Router } from "express";
import { db } from "../db/connection.js";
import {
  projects, proposals, milestones, stageHistory, messages, collaborations,
  impactRecords, challenges, universities, people, industryPartners, knowledgeBase,
  challengeClusters,
} from "../db/schema.js";
import { draftProposal, suggestTeam } from "../services/ai.js";
import { eq, desc } from "drizzle-orm";

export const projectsRouter = Router();

// GET all projects
projectsRouter.get("/", async (req, res) => {
  try {
    const { stage, category } = req.query;
    const allProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt));
    const allUnis = await db.select().from(universities);
    const uniMap = Object.fromEntries(allUnis.map((u) => [u.id, u]));

    let filtered = allProjects;
    if (stage && typeof stage === "string") {
      filtered = filtered.filter((p) => p.stage === stage);
    }
    if (category && typeof category === "string") {
      filtered = filtered.filter((p) => p.category === category);
    }

    const enriched = filtered.map((p) => ({
      ...p,
      university: uniMap[p.universityId] || null,
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project by ID with all related workbench data
projectsRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId));
    const [university] = await db.select().from(universities).where(eq(universities.id, project.universityId));
    const [proposal] = await db.select().from(proposals).where(eq(proposals.projectId, id));

    const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, id));
    const history = await db.select().from(stageHistory).where(eq(stageHistory.projectId, id)).orderBy(desc(stageHistory.createdAt));
    const projectMessages = await db.select().from(messages).where(eq(messages.projectId, id)).orderBy(desc(messages.createdAt));
    
    const collabRows = await db.select().from(collaborations).where(eq(collaborations.projectId, id));
    const allPartners = await db.select().from(industryPartners);
    const partnerMap = Object.fromEntries(allPartners.map((p) => [p.id, p]));
    const collabsWithPartner = collabRows.map((c) => ({
      ...c,
      partner: partnerMap[c.industryPartnerId] || null,
    }));

    const impacts = await db.select().from(impactRecords).where(eq(impactRecords.projectId, id));

    // Suggested team members
    const uniPeople = await db.select().from(people).where(eq(people.universityId, project.universityId));
    const suggestedTeam = suggestTeam(challenge?.category || project.category, challenge?.subTags || [], uniPeople, project.universityId);

    res.json({
      project,
      challenge: challenge || null,
      university: university || null,
      proposal: proposal || null,
      milestones: projectMilestones,
      stageHistory: history,
      messages: projectMessages,
      collaborations: collabsWithPartner,
      impactRecords: impacts,
      suggestedTeam,
      availableIndustryPartners: allPartners,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH advance project stage
projectsRouter.patch("/:id/stage", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stage, note, responsibleParty } = req.body;

    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return res.status(404).json({ error: "Project not found" });

    await db.update(projects).set({ stage, updatedAt: new Date() }).where(eq(projects.id, id));
    await db.update(challenges).set({ status: stage }).where(eq(challenges.id, project.challengeId));

    await db.insert(stageHistory).values({
      projectId: id,
      challengeId: project.challengeId,
      stage,
      note: note || `Progressed to ${stage}`,
      responsibleParty: responsibleParty || "University Team",
    });

    res.json({ success: true, stage });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST auto-draft AI proposal
projectsRouter.post("/:id/proposal/draft", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId));
    const [university] = await db.select().from(universities).where(eq(universities.id, project.universityId));
    const uniPeople = await db.select().from(people).where(eq(people.universityId, project.universityId));
    const team = suggestTeam(challenge.category, challenge.subTags, uniPeople, project.universityId);
    const kb = await db.select().from(knowledgeBase);

    let cluster = null;
    let clusterSize = 1;
    if (challenge.clusterId) {
      const [cl] = await db.select().from(challengeClusters).where(eq(challengeClusters.id, challenge.clusterId));
      cluster = cl ?? null;
      const mems = await db.select().from(challenges).where(eq(challenges.clusterId, challenge.clusterId));
      clusterSize = mems.length;
    }

    const drafted = draftProposal({
      challenge,
      cluster,
      clusterSize,
      university,
      team,
      references: kb.filter((k) => k.category === challenge.category).slice(0, 3),
    });

    const [existing] = await db.select().from(proposals).where(eq(proposals.projectId, id));
    if (existing) {
      await db.update(proposals).set({ ...drafted, isAiDraft: true, updatedAt: new Date() }).where(eq(proposals.id, existing.id));
    } else {
      await db.insert(proposals).values({
        projectId: id,
        ...drafted,
        isAiDraft: true,
        approved: false,
      });
    }

    const [updated] = await db.select().from(proposals).where(eq(proposals.projectId, id));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT save customized proposal
projectsRouter.put("/:id/proposal", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { problemStatement, proposedSolution, requiredTeam, methodology, timeline, budget, expectedOutcomes, impactIndicators, risks, approved } = req.body;

    const [existing] = await db.select().from(proposals).where(eq(proposals.projectId, id));
    if (existing) {
      await db.update(proposals).set({
        problemStatement, proposedSolution, requiredTeam, methodology, timeline, budget, expectedOutcomes, impactIndicators, risks,
        approved: approved !== undefined ? Boolean(approved) : existing.approved,
        isAiDraft: false,
        updatedAt: new Date(),
      }).where(eq(proposals.id, existing.id));
    } else {
      await db.insert(proposals).values({
        projectId: id,
        problemStatement: problemStatement || "",
        proposedSolution: proposedSolution || "",
        requiredTeam: requiredTeam || "",
        methodology: methodology || "",
        timeline: timeline || "",
        budget: budget || "",
        expectedOutcomes: expectedOutcomes || "",
        impactIndicators: impactIndicators || "",
        risks: risks || "",
        approved: Boolean(approved),
        isAiDraft: false,
      });
    }

    const [saved] = await db.select().from(proposals).where(eq(proposals.projectId, id));
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add milestone
projectsRouter.post("/:id/milestones", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { title, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const [mRes] = await db.insert(milestones).values({
      projectId,
      title,
      dueDate: dueDate || "",
      done: false,
    });

    const [m] = await db.select().from(milestones).where(eq(milestones.id, mRes.insertId));
    res.status(201).json(m);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle milestone
projectsRouter.patch("/:id/milestones/:mId", async (req, res) => {
  try {
    const mId = Number(req.params.mId);
    const { done } = req.body;
    await db.update(milestones).set({ done: Boolean(done) }).where(eq(milestones.id, mId));
    res.json({ success: true, done: Boolean(done) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST discussion message
projectsRouter.post("/:id/messages", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { author, role, body } = req.body;
    if (!body) return res.status(400).json({ error: "Message body is required" });

    const [msgRes] = await db.insert(messages).values({
      projectId,
      author: author || "Team Member",
      role: role || "Team",
      body,
    });

    const [created] = await db.select().from(messages).where(eq(messages.id, msgRes.insertId));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST connect industry CSR partner
projectsRouter.post("/:id/collaborations", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { industryPartnerId, supportType, note } = req.body;

    const [collabRes] = await db.insert(collaborations).values({
      projectId,
      industryPartnerId: Number(industryPartnerId),
      supportType: supportType || "Funding",
      note: note || "",
      status: "active",
    });

    const [c] = await db.select().from(collaborations).where(eq(collaborations.id, collabRes.insertId));
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record impact metric
projectsRouter.post("/:id/impact", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { indicator, unit, kind, beforeValue, afterValue, note } = req.body;

    const [iRes] = await db.insert(impactRecords).values({
      projectId,
      indicator: indicator || "Water availability",
      unit: unit || "hours/day",
      kind: kind || "outcome",
      beforeValue: Number(beforeValue) || 0,
      afterValue: Number(afterValue) || 0,
      note: note || "",
    });

    const [rec] = await db.select().from(impactRecords).where(eq(impactRecords.id, iRes.insertId));
    res.status(201).json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
