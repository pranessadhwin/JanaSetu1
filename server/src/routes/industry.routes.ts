import { Router } from "express";
import { db } from "../db/connection.js";
import { industryPartners, collaborations, projects } from "../db/schema.js";

export const industryRouter = Router();

// GET all industry partners with active collaborations
industryRouter.get("/", async (req, res) => {
  try {
    const partners = await db.select().from(industryPartners);
    const allCollabs = await db.select().from(collaborations);
    const allProjects = await db.select().from(projects);
    const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p]));

    const enriched = partners.map((partner) => {
      const partnerCollabs = allCollabs
        .filter((c) => c.industryPartnerId === partner.id)
        .map((c) => ({
          ...c,
          project: projectMap[c.projectId] || null,
        }));

      return {
        ...partner,
        collaborations: partnerCollabs,
        totalSupportedProjects: partnerCollabs.length,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
