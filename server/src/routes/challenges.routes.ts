import { Router } from "express";
import { db } from "../db/connection.js";
import {
  challenges, challengeClusters, universityResponses, universities, people, projects,
  stageHistory, notifications,
} from "../db/schema.js";
import { classifyChallenge, computePriority, findMatchingCluster, matchUniversities } from "../services/ai.js";
import { districtByName } from "../services/districts.js";
import { eq, and, sql, desc } from "drizzle-orm";

export const challengesRouter = Router();

// GET all challenges with optional filters
challengesRouter.get("/", async (req, res) => {
  try {
    const { category, priority, district, status } = req.query;
    const conditions = [];

    if (category && typeof category === "string") conditions.push(eq(challenges.category, category));
    if (priority && typeof priority === "string") conditions.push(eq(challenges.priority, priority));
    if (district && typeof district === "string") conditions.push(eq(challenges.district, district));
    if (status && typeof status === "string") conditions.push(eq(challenges.status, status));

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(challenges).where(query).orderBy(desc(challenges.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single challenge by ID
challengesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    let cluster = null;
    let clusterMembers: typeof challenge[] = [];
    if (challenge.clusterId) {
      const [cl] = await db.select().from(challengeClusters).where(eq(challengeClusters.id, challenge.clusterId));
      cluster = cl ?? null;
      clusterMembers = await db.select().from(challenges).where(eq(challenges.clusterId, challenge.clusterId));
    }

    const responses = await db.select().from(universityResponses).where(eq(universityResponses.challengeId, id));
    const allUnis = await db.select().from(universities);
    const uniMap = Object.fromEntries(allUnis.map((u) => [u.id, u]));

    const responsesWithUni = responses.map((r) => ({
      ...r,
      university: uniMap[r.universityId],
    }));

    const history = await db.select().from(stageHistory).where(eq(stageHistory.challengeId, id)).orderBy(desc(stageHistory.createdAt));
    const notifs = await db.select().from(notifications).where(eq(notifications.challengeId, id)).orderBy(desc(notifications.createdAt));
    const [project] = await db.select().from(projects).where(eq(projects.challengeId, id));

    res.json({
      challenge,
      cluster,
      clusterMembers,
      universityResponses: responsesWithUni,
      stageHistory: history,
      notifications: notifs,
      project: project ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new challenge (citizen report)
challengesRouter.post("/", async (req, res) => {
  try {
    const {
      title, description, category, district, block, village,
      affectedPopulation, hasAlternative, frequency, vulnerableGroups, attachments,
      reporterName, reporterType, lat, lng,
    } = req.body;

    if (!title || !description || !district) {
      return res.status(400).json({ error: "Title, description and district are required." });
    }

    const cls = classifyChallenge(title, description, category || undefined);
    const pop = Number(affectedPopulation) || 0;
    const alt = hasAlternative !== undefined ? Boolean(hasAlternative) : (cls.alternativeHint ?? true);
    const freq = frequency || cls.frequencyHint;
    const vul = [...new Set([...cls.vulnerableGroups, ...(Array.isArray(vulnerableGroups) ? vulnerableGroups : [])])];

    // Clustering
    const clusters = await db.select().from(challengeClusters);
    let cluster = findMatchingCluster({ category: cls.category, subTags: cls.subTags, district }, clusters);
    let clusterId: number;

    if (!cluster) {
      const [newCl] = await db.insert(challengeClusters).values({
        title: `${cls.subTags[0]} — ${district}`,
        category: cls.category,
        subTag: cls.subTags[0],
        district,
      });
      clusterId = newCl.insertId;
    } else {
      clusterId = cluster.id;
    }

    const existingInCluster = await db.select({ count: sql<number>`count(*)` }).from(challenges).where(eq(challenges.clusterId, clusterId));
    const clusterCount = (existingInCluster[0] ? Number(existingInCluster[0].count) : 0) + 1;

    const pr = computePriority({
      category: cls.category,
      affectedPopulation: pop,
      hasAlternative: alt,
      frequency: freq,
      vulnerableGroups: vul,
      urgencyKeywords: cls.urgencyKeywords,
      clusterSize: clusterCount,
      clusterDistricts: 1,
    });

    const d = districtByName(district);
    const finalLat = lat ? Number(lat) : (d?.lat ? d.lat + (Math.random() - 0.5) * 0.2 : null);
    const finalLng = lng ? Number(lng) : (d?.lng ? d.lng + (Math.random() - 0.5) * 0.2 : null);

    const [cRes] = await db.insert(challenges).values({
      title,
      description,
      summary: cls.summary,
      category: cls.category,
      subTags: cls.subTags,
      district,
      block: block || "",
      village: village || "",
      lat: finalLat,
      lng: finalLng,
      affectedPopulation: pop,
      hasAlternative: alt,
      frequency: freq,
      vulnerableGroups: vul,
      urgencyKeywords: cls.urgencyKeywords,
      priority: pr.priority,
      priorityReasons: pr.reasons,
      status: "categorized",
      clusterId,
      reporterName: reporterName || "Anonymous",
      reporterType: reporterType || "Citizen",
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const challengeId = cRes.insertId;

    await db.insert(stageHistory).values([
      { challengeId, stage: "submitted", note: `Reported by ${reporterName || "Anonymous"}`, responsibleParty: reporterType || "Citizen" },
      { challengeId, stage: "validated", note: "Location and description verified", responsibleParty: "Platform" },
      { challengeId, stage: "categorized", note: `Classified as ${cls.category} → ${cls.subTags[0]}; priority ${pr.priority}`, responsibleParty: "Intelligence Engine" },
    ]);

    await db.insert(notifications).values({
      challengeId,
      message: `Your issue was classified under ${cls.category} with ${pr.priority} priority. Nearby universities are being matched.`,
    });

    // Match universities
    const allUnis = await db.select().from(universities);
    const allPeople = await db.select().from(people);
    const matches = matchUniversities({ category: cls.category, subTags: cls.subTags, district }, allUnis, allPeople, 5);

    if (matches.length > 0) {
      await db.insert(universityResponses).values(
        matches.map((m) => ({
          challengeId,
          universityId: m.university.id,
          status: "shortlisted",
          note: "",
          matchReasons: m.reasons,
        }))
      );
    }

    const [created] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST assign challenge to university
challengesRouter.post("/:id/assign", async (req, res) => {
  try {
    const challengeId = Number(req.params.id);
    const { universityId, note } = req.body;

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    const [uni] = await db.select().from(universities).where(eq(universities.id, Number(universityId)));
    if (!uni) return res.status(404).json({ error: "University not found" });

    await db.update(universityResponses)
      .set({ status: "accepted", note: note || "Accepted project assignment" })
      .where(and(eq(universityResponses.challengeId, challengeId), eq(universityResponses.universityId, Number(universityId))));

    await db.update(challenges).set({ status: "assigned" }).where(eq(challenges.id, challengeId));

    const [pRes] = await db.insert(projects).values({
      title: `${challenge.title} — Solution Project`,
      challengeId,
      clusterId: challenge.clusterId,
      universityId: Number(universityId),
      category: challenge.category,
      stage: "assigned",
      team: [],
      impactLevel: "High",
      feasibilityLevel: "Medium",
      costLakh: 5,
      noveltyLevel: "Medium",
      scalabilityLevel: "High",
    });

    const projectId = pRes.insertId;

    await db.insert(stageHistory).values({
      projectId,
      challengeId,
      stage: "assigned",
      note: `Assigned to ${uni.name}. Faculty team mobilised.`,
      responsibleParty: "District Administration",
    });

    await db.insert(notifications).values({
      challengeId,
      message: `Your challenge has been assigned to ${uni.name}! An R&D team is being assembled.`,
    });

    res.json({ success: true, projectId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
