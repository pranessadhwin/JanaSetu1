import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  double,
  json,
} from "drizzle-orm/mysql-core";

export const STAGES = [
  "submitted",
  "validated",
  "categorized",
  "assigned",
  "proposal_created",
  "industry_connected",
  "prototype",
  "pilot",
  "deployed",
  "impact_evaluation",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  submitted: "Submitted",
  validated: "Validated",
  categorized: "Categorized",
  assigned: "Assigned to University",
  proposal_created: "Proposal Created",
  industry_connected: "Industry Connected",
  prototype: "Prototype Developed",
  pilot: "Pilot Testing",
  deployed: "Deployed",
  impact_evaluation: "Impact Evaluation",
};

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type Level = "High" | "Medium" | "Low";

export const universities = mysqlTable("universities", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  description: text("description").notNull(),
  departments: json("departments").$type<string[]>().notNull(),
  expertiseTags: json("expertise_tags").$type<string[]>().notNull(),
  labs: json("labs").$type<string[]>().notNull(),
  pastProjects: json("past_projects").$type<string[]>().notNull(),
  patentsFiled: int("patents_filed").notNull().default(0),
  startupsSpunOff: int("startups_spun_off").notNull().default(0),
});

export const people = mysqlTable("people", {
  id: int("id").primaryKey().autoincrement(),
  universityId: int("university_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // faculty | student
  department: varchar("department", { length: 255 }).notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  available: boolean("available").notNull().default(true),
});

export const industryPartners = mysqlTable("industry_partners", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  description: text("description").notNull(),
  focusAreas: json("focus_areas").$type<string[]>().notNull(),
  offerings: json("offerings").$type<string[]>().notNull(),
});

export const challengeClusters = mysqlTable("challenge_clusters", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subTag: varchar("sub_tag", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challenges = mysqlTable("challenges", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subTags: json("sub_tags").$type<string[]>().notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  block: varchar("block", { length: 100 }).notNull().default(""),
  village: varchar("village", { length: 100 }).notNull().default(""),
  lat: double("lat"),
  lng: double("lng"),
  affectedPopulation: int("affected_population").notNull().default(0),
  hasAlternative: boolean("has_alternative").notNull().default(true),
  frequency: varchar("frequency", { length: 50 }).notNull().default("occasional"), // constant | seasonal | occasional
  vulnerableGroups: json("vulnerable_groups").$type<string[]>().notNull(),
  urgencyKeywords: json("urgency_keywords").$type<string[]>().notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("Low"),
  priorityReasons: json("priority_reasons").$type<string[]>().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"),
  clusterId: int("cluster_id"),
  reporterName: varchar("reporter_name", { length: 150 }).notNull().default("Anonymous"),
  reporterType: varchar("reporter_type", { length: 100 }).notNull().default("Citizen"),
  attachments: json("attachments").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const universityResponses = mysqlTable("university_responses", {
  id: int("id").primaryKey().autoincrement(),
  challengeId: int("challenge_id").notNull(),
  universityId: int("university_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("shortlisted"),
  note: text("note").notNull().default(""),
  matchReasons: json("match_reasons").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = mysqlTable("projects", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  challengeId: int("challenge_id").notNull(),
  clusterId: int("cluster_id"),
  universityId: int("university_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull().default("assigned"),
  team: json("team").$type<{ name: string; role: string; department: string }[]>().notNull(),
  impactLevel: varchar("impact_level", { length: 50 }).notNull().default("Medium"),
  feasibilityLevel: varchar("feasibility_level", { length: 50 }).notNull().default("Medium"),
  costLakh: int("cost_lakh").notNull().default(0),
  noveltyLevel: varchar("novelty_level", { length: 50 }).notNull().default("Medium"),
  scalabilityLevel: varchar("scalability_level", { length: 50 }).notNull().default("Medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const proposals = mysqlTable("proposals", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  problemStatement: text("problem_statement").notNull().default(""),
  proposedSolution: text("proposed_solution").notNull().default(""),
  requiredTeam: text("required_team").notNull().default(""),
  methodology: text("methodology").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  budget: text("budget").notNull().default(""),
  expectedOutcomes: text("expected_outcomes").notNull().default(""),
  impactIndicators: text("impact_indicators").notNull().default(""),
  risks: text("risks").notNull().default(""),
  isAiDraft: boolean("is_ai_draft").notNull().default(true),
  approved: boolean("approved").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stageHistory = mysqlTable("stage_history", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id"),
  challengeId: int("challenge_id").notNull(),
  stage: varchar("stage", { length: 50 }).notNull(),
  note: text("note").notNull().default(""),
  responsibleParty: varchar("responsible_party", { length: 100 }).notNull().default("Platform"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestones = mysqlTable("milestones", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  dueDate: varchar("due_date", { length: 50 }).notNull().default(""),
  done: boolean("done").notNull().default(false),
});

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  author: varchar("author", { length: 150 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("Team"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collaborations = mysqlTable("collaborations", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  industryPartnerId: int("industry_partner_id").notNull(),
  supportType: varchar("support_type", { length: 100 }).notNull(), // Funding | Mentorship | Equipment | CSR Support | Manufacturing
  note: text("note").notNull().default(""),
  status: varchar("status", { length: 50 }).notNull().default("interested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const impactRecords = mysqlTable("impact_records", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  indicator: varchar("indicator", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  kind: varchar("kind", { length: 50 }).notNull().default("outcome"),
  beforeValue: double("before_value").notNull().default(0),
  afterValue: double("after_value").notNull().default(0),
  note: text("note").notNull().default(""),
  measuredAt: timestamp("measured_at").notNull().defaultNow(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  challengeId: int("challenge_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // Research Paper | Case Study | Past Project | Guideline
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  summary: text("summary").notNull(),
  source: varchar("source", { length: 255 }).notNull().default(""),
  costLakh: int("cost_lakh"),
});

export type University = typeof universities.$inferSelect;
export type Person = typeof people.$inferSelect;
export type IndustryPartner = typeof industryPartners.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeCluster = typeof challengeClusters.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type KnowledgeItem = typeof knowledgeBase.$inferSelect;
export type ImpactRecord = typeof impactRecords.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type StageHistory = typeof stageHistory.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;
