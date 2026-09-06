import { Router } from "express";
import { db } from "../db/connection.js";
import { challenges, projects, universities, industryPartners, challengeClusters } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const dashboardRouter = Router();

// GET government metrics and analytics
dashboardRouter.get("/", async (req, res) => {
  try {
    const allChallenges = await db.select().from(challenges);
    const allProjects = await db.select().from(projects);
    const allUnis = await db.select().from(universities);
    const allIndustry = await db.select().from(industryPartners);
    const allClusters = await db.select().from(challengeClusters);

    const totalPopulation = allChallenges.reduce((sum, c) => sum + (c.affectedPopulation || 0), 0);
    const pilotsDeployed = allProjects.filter((p) => ["pilot", "deployed", "impact_evaluation"].includes(p.stage)).length;

    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    for (const c of allChallenges) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    // Priority breakdown
    const priorityCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const c of allChallenges) {
      priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
    }

    // Stage breakdown
    const stageCounts: Record<string, number> = {};
    for (const p of allProjects) {
      stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
    }

    // District breakdown
    const districtCounts: Record<string, number> = {};
    for (const c of allChallenges) {
      districtCounts[c.district] = (districtCounts[c.district] || 0) + 1;
    }

    const recentChallenges = [...allChallenges].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

    res.json({
      summary: {
        totalChallenges: allChallenges.length,
        totalProjects: allProjects.length,
        totalUniversities: allUnis.length,
        totalIndustryPartners: allIndustry.length,
        totalClusters: allClusters.length,
        totalPopulationAffected: totalPopulation,
        pilotsDeployed,
      },
      categoryDistribution: categoryCounts,
      priorityDistribution: priorityCounts,
      stageDistribution: stageCounts,
      districtBreakdown: districtCounts,
      recentChallenges,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
