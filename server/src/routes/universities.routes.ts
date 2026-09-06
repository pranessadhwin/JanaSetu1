import { Router } from "express";
import { db } from "../db/connection.js";
import { universities, people, projects, challenges } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const universitiesRouter = Router();

// GET all universities with count of people and active projects
universitiesRouter.get("/", async (req, res) => {
  try {
    const unis = await db.select().from(universities);
    const allPeople = await db.select().from(people);
    const allProjects = await db.select().from(projects);

    const enriched = unis.map((u) => {
      const uniPeople = allPeople.filter((p) => p.universityId === u.id);
      const uniProjects = allProjects.filter((p) => p.universityId === u.id);
      return {
        ...u,
        facultyCount: uniPeople.filter((p) => p.role === "faculty").length,
        studentCount: uniPeople.filter((p) => p.role === "student").length,
        activeProjectsCount: uniProjects.length,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single university by ID
universitiesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [uni] = await db.select().from(universities).where(eq(universities.id, id));
    if (!uni) return res.status(404).json({ error: "University not found" });

    const faculty = await db.select().from(people).where(eq(people.universityId, id));
    const uniProjects = await db.select().from(projects).where(eq(projects.universityId, id));
    const allChallenges = await db.select().from(challenges);
    const challengeMap = Object.fromEntries(allChallenges.map((c) => [c.id, c]));

    const projectsWithChallenge = uniProjects.map((p) => ({
      ...p,
      challenge: challengeMap[p.challengeId] || null,
    }));

    res.json({
      university: uni,
      people: faculty,
      projects: projectsWithChallenge,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
