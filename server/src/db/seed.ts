import { db } from "./connection.js";
import {
  universities, people, industryPartners, knowledgeBase, challengeClusters, challenges,
  universityResponses, projects, proposals, stageHistory, milestones, messages, collaborations,
  impactRecords, notifications,
} from "./schema.js";
import { classifyChallenge, computePriority, matchUniversities } from "../services/ai.js";
import { districtByName } from "../services/districts.js";
import { eq, sql } from "drizzle-orm";

let seeding: Promise<void> | null = null;

export async function seedIfEmpty() {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      const existing = await db.select({ count: sql<number>`count(*)` }).from(universities);
      if (existing[0] && Number(existing[0].count) > 0) {
        return;
      }
      console.log("🌱 Database is empty. Seeding initial data for Jharkhand...");
      await seed();
      console.log("✅ Seeding completed successfully!");
    } catch (err: any) {
      console.warn("⚠️  Could not run auto-seed (MySQL may not be running yet):", err.message);
    }
  })().finally(() => { seeding = null; });
  return seeding;
}

async function seed() {
  await db.insert(universities).values([
    {
      name: "Birla Institute of Technology, Mesra", shortName: "BIT Mesra", district: "Ranchi",
      description: "Deemed university with strong engineering, remote sensing and rural technology programmes.",
      departments: ["Civil Engineering", "Mechanical Engineering", "Computer Science", "Electrical Engineering", "Environmental Engineering", "Remote Sensing"],
      expertiseTags: ["Groundwater", "Hydrology", "Water Management", "IoT", "Renewable Energy", "GIS", "Structural Engineering"],
      labs: ["Water Testing Laboratory", "IoT & Embedded Systems Lab", "Fabrication Workshop", "GIS & Remote Sensing Lab"],
      pastProjects: ["Water recharge structures for Ranchi plateau villages", "Solar micro-grid pilot in Khunti", "Bridge condition survey for PMGSY roads"],
      patentsFiled: 4, startupsSpunOff: 2,
    },
    {
      name: "Indian Institute of Technology (ISM) Dhanbad", shortName: "IIT (ISM) Dhanbad",
      district: "Dhanbad", description: "Premier institute for mining, environmental and earth sciences with advanced laboratories.",
      departments: ["Mining Engineering", "Environmental Science & Engineering", "Applied Geology", "Computer Science", "Mechanical Engineering", "Electronics & Communication"],
      expertiseTags: ["Environmental Engineering", "Mining", "Groundwater", "Air Quality", "Water Quality", "Geology", "Machine Learning"],
      labs: ["Environmental Monitoring Lab", "Hydrogeology Lab", "Water Quality Lab", "Advanced Fabrication Facility"],
      pastProjects: ["Coal dust suppression system for Jharia", "Fluoride removal units in Giridih", "Mine water reuse for irrigation in Bokaro"],
      patentsFiled: 9, startupsSpunOff: 3,
    },
    {
      name: "National Institute of Technology Jamshedpur", shortName: "NIT Jamshedpur", district: "East Singhbhum",
      description: "Engineering institute with industrial linkages in the Kolhan region.",
      departments: ["Civil Engineering", "Mechanical Engineering", "Computer Science", "Electrical Engineering", "Metallurgy", "Electronics & Communication"],
      expertiseTags: ["Structural Engineering", "Transportation", "Solar", "Renewable Energy", "IoT", "Filtration", "Manufacturing"],
      labs: ["Structural Testing Lab", "Solar Energy Lab", "Embedded Systems Lab", "Prototyping Workshop"],
      pastProjects: ["Low-cost culvert design for tribal blocks", "Solar streetlight monitoring in Seraikela"],
      patentsFiled: 3, startupsSpunOff: 1,
    },
    {
      name: "Birsa Agricultural University", shortName: "BAU Ranchi", district: "Ranchi",
      description: "State agricultural university focused on tribal farming systems, soil and water conservation.",
      departments: ["Agricultural Engineering", "Agronomy", "Soil Science", "Plant Protection", "Forestry", "Veterinary Science"],
      expertiseTags: ["Irrigation", "Soil Science", "Water Management", "Rainwater Harvesting", "Agronomy", "Plant Protection", "Forestry", "Food Technology"],
      labs: ["Soil & Water Testing Laboratory", "Irrigation Field Station", "Seed Technology Lab", "Post-Harvest Lab"],
      pastProjects: ["Drip irrigation for vegetable growers in Lohardaga", "Farm pond based rainwater harvesting in Gumla", "Lac cultivation livelihood program"],
      patentsFiled: 2, startupsSpunOff: 1,
    },
    {
      name: "Rajendra Institute of Medical Sciences", shortName: "RIMS Ranchi", district: "Ranchi",
      description: "State medical college and hospital with community medicine and telemedicine units.",
      departments: ["Community Medicine", "Paediatrics", "Obstetrics & Gynaecology", "Public Health", "Biomedical Engineering"],
      expertiseTags: ["Public Health", "Telemedicine", "Nutrition", "Community Medicine", "Maternal Health"],
      labs: ["Telemedicine Centre", "Public Health Laboratory", "Nutrition Rehabilitation Centre"],
      pastProjects: ["Telemedicine outreach in Khunti PHCs", "Anaemia screening for adolescent girls in Gumla"],
      patentsFiled: 0, startupsSpunOff: 0,
    },
    {
      name: "Central University of Jharkhand", shortName: "CUJ Ranchi", district: "Ranchi",
      description: "Central university with energy engineering, environmental science and tribal studies programmes.",
      departments: ["Energy Engineering", "Environmental Science", "Computer Science", "Water Engineering & Management", "Tribal Studies", "Mass Communication"],
      expertiseTags: ["Renewable Energy", "Solar", "Environmental Science", "Water Management", "Hydrology", "Rural Development", "Social Sciences"],
      labs: ["Renewable Energy Lab", "Environmental Analysis Lab", "Water Resources Lab"],
      pastProjects: ["Solar water pumping study in Latehar", "Community forest management with Munda villages"],
      patentsFiled: 1, startupsSpunOff: 0,
    },
    {
      name: "Nilamber-Pitamber University", shortName: "NPU Palamu", district: "Palamu",
      description: "State university serving the drought-prone Palamu division.",
      departments: ["Geography", "Geology", "Botany", "Rural Development", "Computer Applications"],
      expertiseTags: ["Geology", "Groundwater", "Rural Development", "Field Survey", "Social Sciences"],
      labs: ["Geology Field Laboratory", "Computer Centre"],
      pastProjects: ["Groundwater mapping of Daltongang block", "Drought vulnerability survey of Palamu villages"],
      patentsFiled: 0, startupsSpunOff: 0,
    },
  ]);

  const unis = await db.select().from(universities);
  const u = Object.fromEntries(unis.map((x) => [x.shortName, x.id]));

  await db.insert(people).values([
    { universityId: u["BIT Mesra"], name: "Dr. Anjali Verma", role: "faculty", department: "Civil Engineering", skills: ["Groundwater", "Hydrology", "Rainwater Harvesting", "Field Survey"] },
    { universityId: u["BIT Mesra"], name: "Dr. Rakesh Mahto", role: "faculty", department: "Computer Science", skills: ["IoT", "Sensor Networks", "Machine Learning"] },
    { universityId: u["BIT Mesra"], name: "Dr. S. K. Sinha", role: "faculty", department: "Mechanical Engineering", skills: ["Pumps", "Fabrication", "Filtration"] },
    { universityId: u["BIT Mesra"], name: "Priya Kumari", role: "student", department: "Civil Engineering", skills: ["Hydrology", "AutoCAD", "Field Survey"] },
    { universityId: u["BIT Mesra"], name: "Amit Oraon", role: "student", department: "Computer Science", skills: ["IoT", "Embedded Systems", "Dashboards"] },
    { universityId: u["BIT Mesra"], name: "Sneha Toppo", role: "student", department: "Mechanical Engineering", skills: ["CAD", "Fabrication", "Pumps"] },
    { universityId: u["BIT Mesra"], name: "Rohit Munda", role: "student", department: "Environmental Engineering", skills: ["Water Quality", "Environmental Engineering"] },
    { universityId: u["IIT (ISM) Dhanbad"], name: "Prof. Meera Das", role: "faculty", department: "Environmental Science & Engineering", skills: ["Water Quality", "Fluoride", "Environmental Engineering", "Air Quality"] },
    { universityId: u["IIT (ISM) Dhanbad"], name: "Dr. Vikram Singh", role: "faculty", department: "Applied Geology", skills: ["Groundwater", "Hydrogeology", "Geology"] },
    { universityId: u["IIT (ISM) Dhanbad"], name: "Kunal Agarwal", role: "student", department: "Environmental Science & Engineering", skills: ["Water Quality", "Lab Analysis"] },
    { universityId: u["IIT (ISM) Dhanbad"], name: "Nisha Hembrom", role: "student", department: "Computer Science", skills: ["Machine Learning", "IoT"] },
    { universityId: u["NIT Jamshedpur"], name: "Dr. P. K. Choudhary", role: "faculty", department: "Civil Engineering", skills: ["Structural Engineering", "Transportation", "Bridges"] },
    { universityId: u["NIT Jamshedpur"], name: "Dr. Farhan Ali", role: "faculty", department: "Electrical Engineering", skills: ["Solar", "Renewable Energy", "Micro-grids"] },
    { universityId: u["NIT Jamshedpur"], name: "Arjun Soren", role: "student", department: "Electrical Engineering", skills: ["Solar", "Power Electronics"] },
    { universityId: u["NIT Jamshedpur"], name: "Deepa Mahali", role: "student", department: "Civil Engineering", skills: ["Structural Engineering", "Surveying"] },
    { universityId: u["BAU Ranchi"], name: "Dr. Sunita Ekka", role: "faculty", department: "Agricultural Engineering", skills: ["Irrigation", "Water Management", "Rainwater Harvesting", "Soil Science"] },
    { universityId: u["BAU Ranchi"], name: "Dr. B. N. Prasad", role: "faculty", department: "Agronomy", skills: ["Agronomy", "Plant Protection", "Crop Planning"] },
    { universityId: u["BAU Ranchi"], name: "Manish Kujur", role: "student", department: "Agricultural Engineering", skills: ["Irrigation", "Farm Machinery"] },
    { universityId: u["BAU Ranchi"], name: "Rina Lakra", role: "student", department: "Soil Science", skills: ["Soil Science", "Soil Testing"] },
    { universityId: u["RIMS Ranchi"], name: "Dr. Kavita Sahu", role: "faculty", department: "Community Medicine", skills: ["Public Health", "Telemedicine", "Maternal Health"] },
    { universityId: u["RIMS Ranchi"], name: "Dr. Ajay Tirkey", role: "faculty", department: "Paediatrics", skills: ["Nutrition", "Child Health"] },
    { universityId: u["RIMS Ranchi"], name: "Pooja Minz", role: "student", department: "Public Health", skills: ["Public Health", "Survey Design"] },
    { universityId: u["CUJ Ranchi"], name: "Dr. Neeraj Kumar", role: "faculty", department: "Energy Engineering", skills: ["Solar", "Renewable Energy", "Water Pumping"] },
    { universityId: u["CUJ Ranchi"], name: "Dr. Alka Bhagat", role: "faculty", department: "Water Engineering & Management", skills: ["Hydrology", "Water Management", "Watershed"] },
    { universityId: u["CUJ Ranchi"], name: "Sanjay Bedia", role: "student", department: "Energy Engineering", skills: ["Solar", "Electronics"] },
    { universityId: u["CUJ Ranchi"], name: "Ritu Xalxo", role: "student", department: "Computer Science", skills: ["Web Development", "Dashboards"] },
    { universityId: u["NPU Palamu"], name: "Dr. R. P. Yadav", role: "faculty", department: "Geology", skills: ["Groundwater", "Geology", "Field Survey"] },
    { universityId: u["NPU Palamu"], name: "Sushil Paswan", role: "student", department: "Rural Development", skills: ["Community Mobilisation", "Survey"] },
  ]);

  await db.insert(industryPartners).values([
    { name: "JalSense Technologies", sector: "Water Technology", district: "Ranchi", description: "Startup building solar-powered IoT water monitoring for rural supply schemes.", focusAreas: ["Water", "IoT", "Drinking Water Scarcity", "Groundwater"], offerings: ["Equipment", "Mentorship", "Manufacturing"] },
    { name: "Tata Steel Foundation", sector: "CSR", district: "East Singhbhum", description: "CSR arm supporting water, health and education projects across Kolhan and beyond.", focusAreas: ["Water", "Healthcare", "Education", "Livelihood"], offerings: ["Funding", "CSR Support"] },
    { name: "Coal India CSR (CCL)", sector: "CSR", district: "Ranchi", description: "Central Coalfields CSR programme for mining-affected districts.", focusAreas: ["Environment", "Water", "Healthcare", "Mining & Pollution"], offerings: ["Funding", "CSR Support"] },
    { name: "AgriRoots Solutions", sector: "AgriTech", district: "Ranchi", description: "Precision-irrigation and farm advisory company working with FPOs.", focusAreas: ["Agriculture", "Irrigation", "IoT", "Crop Loss & Yield"], offerings: ["Equipment", "Mentorship"] },
    { name: "SuryaGrid Energy", sector: "Renewable Energy", district: "Dhanbad", description: "Solar micro-grid and solar pumping installer.", focusAreas: ["Energy", "Solar", "Electricity Access", "Water Pumping"], offerings: ["Equipment", "Manufacturing", "Funding"] },
    { name: "Sehat Connect", sector: "HealthTech", district: "Ranchi", description: "Telemedicine platform for PHCs and community health workers.", focusAreas: ["Healthcare", "Telemedicine", "Rural Health Access"], offerings: ["Mentorship", "Equipment"] },
    { name: "Jharkhand Infra Builders", sector: "Construction", district: "Hazaribagh", description: "Rural infrastructure contractor for roads, culverts and small structures.", focusAreas: ["Infrastructure", "Rural Roads & Connectivity", "Civil Engineering"], offerings: ["Manufacturing", "Mentorship"] },
  ]);
  const partners = await db.select().from(industryPartners);
  const p = Object.fromEntries(partners.map((x) => [x.name, x.id]));

  await db.insert(knowledgeBase).values([
    { title: "Handpump recharge pits in Palamu — pilot results 2024", type: "Past Project", category: "Water", tags: ["handpump", "recharge", "groundwater", "Drinking Water Scarcity", "Palamu"], summary: "Recharge pits 3–5 m from handpumps extended summer availability by 6–8 weeks in 6 of 8 pilot villages. Cost ₹45,000 per pit.", source: "BIT Mesra / JanaSetu", costLakh: 4 },
    { title: "Solar IoT water-level monitoring for rural supply", type: "Case Study", category: "Water", tags: ["IoT", "sensor", "water level", "monitoring", "solar", "Drinking Water Scarcity"], summary: "ESP32 + ultrasonic sensor units with GSM reporting; ₹4,200 per unit at 50 units; 92% uptime over one monsoon.", source: "JalSense Technologies", costLakh: 3 },
    { title: "Fluoride mitigation in Giridih using activated alumina", type: "Research Paper", category: "Water", tags: ["fluoride", "water quality", "filtration", "Water Quality"], summary: "Community-scale activated alumina columns reduced fluoride from 4.1 to 0.9 mg/L; regeneration needed every 4 months.", source: "IIT (ISM) Dhanbad", costLakh: 6 },
    { title: "Farm-pond based rainwater harvesting in Gumla", type: "Past Project", category: "Agriculture", tags: ["rainwater", "farm pond", "irrigation", "Irrigation"], summary: "5% farm area ponds provided life-saving irrigation for rabi vegetables; income up 38% for 120 farmers.", source: "BAU Ranchi", costLakh: 9 },
    { title: "Telemedicine outreach model for PHCs in Khunti", type: "Case Study", category: "Healthcare", tags: ["telemedicine", "PHC", "Rural Health Access", "health worker"], summary: "Weekly tele-consultations via ANMs at 6 PHCs reduced referral travel by 60%; needs reliable 4G or offline sync.", source: "RIMS Ranchi", costLakh: 5 },
    { title: "Solar micro-grid operator model, Khunti", type: "Past Project", category: "Energy", tags: ["solar", "micro-grid", "Electricity Access", "operator"], summary: "Village-level entrepreneur operator collecting ₹150/month per household sustained a 10 kW grid for 3 years.", source: "BIT Mesra", costLakh: 18 },
    { title: "Low-cost culvert design for monsoon-cut villages", type: "Research Paper", category: "Infrastructure", tags: ["culvert", "road", "Rural Roads & Connectivity", "monsoon"], summary: "Precast box culvert design using local aggregate at 40% lower cost than standard schedule rates.", source: "NIT Jamshedpur", costLakh: 12 },
    { title: "Coal dust suppression with mist cannons in Jharia", type: "Case Study", category: "Environment", tags: ["coal dust", "air quality", "Mining & Pollution", "mist"], summary: "PM10 reduced by 35% near haul roads; operating cost ₹1.2 lakh/month.", source: "IIT (ISM) Dhanbad", costLakh: 25 },
    { title: "Anaemia screening and nutrition counselling for adolescent girls", type: "Past Project", category: "Healthcare", tags: ["anaemia", "nutrition", "Nutrition", "anganwadi"], summary: "Haemoglobin improved by 1.4 g/dL average over 6 months with weekly IFA and dietary counselling.", source: "RIMS Ranchi", costLakh: 3 },
    { title: "Rainwater harvesting design guideline for Jharkhand plateau", type: "Guideline", category: "Water", tags: ["rainwater", "harvesting", "design", "roof", "storage"], summary: "Design tables for roof catchment, first-flush, filter chamber and ferro-cement storage sizes for 1,000–1,400 mm rainfall.", source: "Drinking Water & Sanitation Dept, GoJ" },
  ]);

  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

  const [wcRes] = await db.insert(challengeClusters).values({ title: "Drinking Water Scarcity — Palamu Division", category: "Water", subTag: "Drinking Water Scarcity", district: "Palamu" });
  const waterClusterId = wcRes.insertId;

  const [owRes] = await db.insert(challengeClusters).values({ title: "Drinking Water Scarcity — Khunti", category: "Water", subTag: "Drinking Water Scarcity", district: "Khunti" });
  const oldWaterClusterId = owRes.insertId;

  const [rcRes] = await db.insert(challengeClusters).values({ title: "Monsoon Road Cut-off — West Singhbhum", category: "Infrastructure", subTag: "Rural Roads & Connectivity", district: "West Singhbhum" });
  const roadClusterId = rcRes.insertId;

  type Seed = { title: string; description: string; district: string; block: string; village: string; pop: number; alt: boolean; freq: string; reporter: string; reporterType: string; days: number; clusterId?: number | null; status?: string; attachments?: string[]; category?: string };

  const waterVillages: Seed[] = [
    { title: "Our village handpump dries up every summer", description: "Our village handpump dries up every summer from April to June. Women and children walk 3 km to the nearest river for drinking water. There is no other source in the village. Tribal families are the worst affected.", district: "Palamu", block: "Chainpur", village: "Bhandaria", pop: 1200, alt: false, freq: "seasonal", reporter: "Sunil Oraon", reporterType: "Citizen", days: 34, attachments: ["handpump_photo.jpg", "voice_note_hindi.m4a"] },
    { title: "Handpumps stop working in summer months", description: "All three handpumps in our tola give no water after March every year. We depend on a tanker that comes twice a week. Children fall sick from river water.", district: "Palamu", block: "Chainpur", village: "Kundri", pop: 900, alt: false, freq: "seasonal", reporter: "Gram Panchayat Kundri", reporterType: "Panchayat", days: 31, attachments: ["dry_handpump.jpg"] },
    { title: "Borewell water level falling every year", description: "Groundwater level is falling. Borewell dries by May. Every summer the same water shortage. Elderly people cannot walk far for water.", district: "Palamu", block: "Lesliganj", village: "Sarja", pop: 1500, alt: true, freq: "seasonal", reporter: "Meena Devi", reporterType: "Citizen", days: 29 },
    { title: "Severe drinking water shortage in summer", description: "Drinking water shortage every summer. Handpump gives yellow water then dries up. No alternative except a pond shared with cattle.", district: "Garhwa", block: "Ranka", village: "Ramkanda", pop: 2100, alt: false, freq: "seasonal", reporter: "Jan Kalyan NGO", reporterType: "NGO", days: 27, attachments: ["pond_photo.jpg", "video_report.mp4"] },
    { title: "Water scarcity in 4 tolas of our panchayat", description: "Four tolas face acute drinking water shortage from April. Handpumps dry up. Women spend 3 hours daily collecting water.", district: "Garhwa", block: "Bhandaria", village: "Chinia", pop: 3000, alt: true, freq: "seasonal", reporter: "Mukhiya, Chinia Panchayat", reporterType: "Panchayat", days: 25 },
    { title: "Handpump dry, tanker irregular", description: "Handpump dries up every summer. Tanker supply is irregular. Pregnant women and children suffer the most.", district: "Latehar", block: "Manika", village: "Namudag", pop: 800, alt: false, freq: "seasonal", reporter: "ASHA worker Rekha", reporterType: "Citizen", days: 22 },
    { title: "No drinking water in summer for school", description: "School handpump dries up in summer and students have no drinking water. Attendance falls in May.", district: "Latehar", block: "Balumath", village: "Hesla", pop: 600, alt: true, freq: "seasonal", reporter: "Headmaster, Govt Middle School", reporterType: "Government Department", days: 20 },
    { title: "Groundwater shortage across Chhatarpur block villages", description: "Block office receives complaints from 12 villages every summer about handpumps drying up. Groundwater shortage is a recurring seasonal problem across the block.", district: "Palamu", block: "Chhatarpur", village: "Multiple villages", pop: 9000, alt: true, freq: "seasonal", reporter: "Block Development Office, Chhatarpur", reporterType: "Government Department", days: 18 },
  ];

  const otherSeeds: Seed[] = [
    { title: "Fluoride in handpump water causing dental problems", description: "Handpump water in our village has high fluoride. Children have yellow teeth and elderly have joint pain. Water quality is contaminated. We have been drinking it for years.", district: "Giridih", block: "Tisri", village: "Bhelwaghati", pop: 1800, alt: false, freq: "constant", reporter: "Ramesh Yadav", reporterType: "Citizen", days: 40, attachments: ["teeth_photo.jpg"] },
    { title: "Village cut off during monsoon — no bridge over the stream", description: "Every monsoon our village is cut off for 2–3 months because there is no bridge or culvert over the stream. Ambulance cannot reach. Last year a pregnant woman died on the way.", district: "West Singhbhum", block: "Goilkera", village: "Sonua", pop: 2500, alt: false, freq: "seasonal", reporter: "Gram Sabha Sonua", reporterType: "Panchayat", days: 50, clusterId: roadClusterId, attachments: ["stream_video.mp4"] },
    { title: "Road submerged in rains, children cannot reach school", description: "Kachcha road is submerged during monsoon. School children cannot reach school for weeks. Need a culvert and raised road.", district: "West Singhbhum", block: "Manoharpur", village: "Chiria", pop: 1100, alt: true, freq: "seasonal", reporter: "Sushila Purty", reporterType: "Citizen", days: 45, clusterId: roadClusterId },
    { title: "Elephants destroying paddy crops near forest villages", description: "Elephant herds enter our fields every night in harvest season and destroy paddy. Farmers lose crop and it is dangerous for people. Forest department cannot respond in time.", district: "Simdega", block: "Bano", village: "Kurdeg", pop: 700, alt: true, freq: "seasonal", reporter: "Farmers Club Kurdeg", reporterType: "NGO", days: 15, category: "Environment" },
    { title: "No doctor at PHC, patients travel 40 km", description: "Our PHC has no doctor for 6 months. Patients with fever and pregnant women travel 40 km to the district hospital. Malaria cases are rising.", district: "Gumla", block: "Chainpur", village: "Chainpur PHC", pop: 12000, alt: true, freq: "constant", reporter: "Panchayat Samiti Chainpur", reporterType: "Panchayat", days: 12 },
    { title: "Vegetable crop spoils before reaching market", description: "Farmers grow tomato and cauliflower but 30% spoils before reaching mandi. No cold storage nearby and market price crashes at harvest.", district: "Lohardaga", block: "Kisko", village: "Kisko", pop: 2200, alt: true, freq: "seasonal", reporter: "Kisko FPO", reporterType: "NGO", days: 9 },
    { title: "Coal dust from mines covering homes and crops", description: "Coal dust from the nearby mine and trucks covers our houses, school and crops. Children have breathing problems. Air quality is very poor.", district: "Dhanbad", block: "Jharia", village: "Bhowra", pop: 6000, alt: true, freq: "constant", reporter: "Bhowra Residents Committee", reporterType: "NGO", days: 6 },
    { title: "Power cuts for 10 hours daily affecting students", description: "Our village gets electricity only 8–10 hours a day. Students cannot study at night. The transformer burns out repeatedly. Solar street lights are also not working.", district: "Dumka", block: "Jama", village: "Chikniya", pop: 1400, alt: true, freq: "constant", reporter: "Yuva Mandal Chikniya", reporterType: "NGO", days: 3 },
  ];

  const khuntiSeeds: Seed[] = [
    { title: "Handpumps dry in summer across Murhu block villages", description: "Handpumps in 8 villages dry up every summer. Families depend on a distant stream. No alternative source.", district: "Khunti", block: "Murhu", village: "Murhu (8 villages)", pop: 4500, alt: false, freq: "seasonal", reporter: "Block Office Murhu", reporterType: "Government Department", days: 420, clusterId: oldWaterClusterId, status: "impact_evaluation" },
  ];

  const allUnis = unis;
  const allPeople = await db.select().from(people);

  const insertChallenge = async (s: Seed, clusterId: number | null, clusterSize: number, clusterDistricts: number, status = "categorized") => {
    const cls = classifyChallenge(s.title, s.description, s.category);
    const pr = computePriority({ category: cls.category, affectedPopulation: s.pop, hasAlternative: s.alt, frequency: s.freq, vulnerableGroups: cls.vulnerableGroups, urgencyKeywords: cls.urgencyKeywords, clusterSize, clusterDistricts, firstReportedAt: daysAgo(s.days) });
    const d = districtByName(s.district);
    
    const [cRes] = await db.insert(challenges).values({
      title: s.title, description: s.description, summary: cls.summary, category: cls.category, subTags: cls.subTags,
      district: s.district, block: s.block, village: s.village,
      lat: d ? d.lat + (Math.random() - 0.5) * 0.3 : null, lng: d ? d.lng + (Math.random() - 0.5) * 0.3 : null,
      affectedPopulation: s.pop, hasAlternative: s.alt, frequency: s.freq, vulnerableGroups: cls.vulnerableGroups, urgencyKeywords: cls.urgencyKeywords,
      priority: pr.priority, priorityReasons: pr.reasons, status: s.status ?? status, clusterId, reporterName: s.reporter, reporterType: s.reporterType,
      attachments: s.attachments ?? [], createdAt: daysAgo(s.days),
    });
    const cId = cRes.insertId;

    await db.insert(stageHistory).values([
      { challengeId: cId, stage: "submitted", note: `Reported by ${s.reporter}`, responsibleParty: s.reporterType, createdAt: daysAgo(s.days) },
      { challengeId: cId, stage: "validated", note: "Report validated — location and description verified", responsibleParty: "Platform", createdAt: daysAgo(s.days - 0.2) },
      { challengeId: cId, stage: "categorized", note: `Classified as ${cls.category} → ${cls.subTags[0]}; priority ${pr.priority}`, responsibleParty: "Intelligence Engine", createdAt: daysAgo(s.days - 0.3) },
    ]);
    await db.insert(notifications).values({ challengeId: cId, message: `Your report has been categorized as ${cls.category} (${cls.subTags[0]}) with ${pr.priority} priority.`, createdAt: daysAgo(s.days - 0.3) });

    const matches = matchUniversities({ category: cls.category, subTags: cls.subTags, district: s.district }, allUnis, allPeople, 5);
    if (matches.length) {
      await db.insert(universityResponses).values(matches.map((m) => ({ challengeId: cId, universityId: m.university.id, status: "shortlisted", matchReasons: m.reasons, createdAt: daysAgo(s.days - 0.4) })));
    }
    const [row] = await db.select().from(challenges).where(eq(challenges.id, cId));
    return row;
  };

  const waterRows = [];
  for (const s of waterVillages) waterRows.push(await insertChallenge(s, waterClusterId, waterVillages.length, 3, "assigned"));
  for (const s of otherSeeds) await insertChallenge(s, s.clusterId ?? null, s.clusterId ? 2 : 1, 1);
  const khunti = await insertChallenge(khuntiSeeds[0], oldWaterClusterId, 1, 1, "impact_evaluation");

  // Project 1: Palamu water
  const lead = waterRows[0];
  await db.update(universityResponses).set({ status: "accepted", note: "Team available from Civil, CSE and Mechanical; field visit planned." }).where(sql`challenge_id = ${lead.id} and university_id = ${u["BIT Mesra"]}`);
  await db.update(universityResponses).set({ status: "declined", note: "Faculty on sabbatical this semester." }).where(sql`challenge_id = ${lead.id} and university_id = ${u["IIT (ISM) Dhanbad"]}`);
  await db.update(universityResponses).set({ status: "clarification", note: "Please share geological survey data for Chainpur block if available." }).where(sql`challenge_id = ${lead.id} and university_id = ${u["NPU Palamu"]}`);

  const [p1Res] = await db.insert(projects).values({
    title: "Seasonal Handpump Revival & Monitoring — Palamu Division", challengeId: lead.id, clusterId: waterClusterId, universityId: u["BIT Mesra"], category: "Water", stage: "prototype",
    team: [
      { name: "Dr. Anjali Verma", role: "Faculty mentor", department: "Civil Engineering" },
      { name: "Dr. Rakesh Mahto", role: "Faculty mentor", department: "Computer Science" },
      { name: "Priya Kumari", role: "Student", department: "Civil Engineering" },
      { name: "Amit Oraon", role: "Student", department: "Computer Science" },
      { name: "Sneha Toppo", role: "Student", department: "Mechanical Engineering" },
    ],
    impactLevel: "High", feasibilityLevel: "High", costLakh: 11, noveltyLevel: "Medium", scalabilityLevel: "High", createdAt: daysAgo(24), updatedAt: daysAgo(2),
  });
  const proj1Id = p1Res.insertId;

  await db.insert(proposals).values({
    projectId: proj1Id, isAiDraft: false, approved: true,
    problemStatement: "Eight villages across Palamu, Garhwa and Latehar report handpumps and borewells drying between April and June every year. ~19,000 people are affected; several villages have no alternative source and women walk up to 3 km for water.",
    proposedSolution: "Recharge pits adjacent to the 24 worst-affected handpumps, combined with solar-powered IoT water-level monitors that alert the Block office two weeks before a source is expected to fail, so tankers are scheduled proactively. Village water committees are trained to maintain both.",
    requiredTeam: "Civil Engineering (recharge design, hydrology), Computer Science (sensor units, dashboard), Mechanical Engineering (pump servicing), NPU Palamu (field survey partner).",
    methodology: "1. Baseline survey of 24 handpumps (static water level, discharge, dry dates).\n2. Recharge pit design per site using soil infiltration tests.\n3. Prototype monitor built and calibrated at BIT Mesra water lab.\n4. Single-site test in Bhandaria.\n5. Pilot in 3 villages (Bhandaria, Ramkanda, Namudag) with different terrain.\n6. Evaluation and scale-up plan.",
    timeline: "Month 1: Baseline\nMonth 2–3: Design & prototype\nMonth 4: Bhandaria test\nMonth 5–8: 3-village pilot\nMonth 9: Evaluation",
    budget: "₹11 lakh total — recharge pits ₹5.4 lakh (24 × ₹22,500 with community labour), monitors ₹1.5 lakh (30 units), survey & travel ₹1.2 lakh, training ₹0.8 lakh, contingency ₹2.1 lakh.",
    expectedOutcomes: "24 recharge structures, 30 monitoring units, 8 trained water committees, block-level early-warning dashboard.",
    impactIndicators: "People with reliable summer water; hours of availability per day; shortage days per month; time spent collecting water.",
    risks: "Hard rock geology limits recharge in some sites (mitigated by infiltration tests); GSM coverage gaps (SMS fallback); pit siltation (annual desilting by committee).",
    updatedAt: daysAgo(14),
  });

  await db.insert(stageHistory).values([
    { projectId: proj1Id, challengeId: lead.id, stage: "assigned", note: "BIT Mesra accepted; assignment approved by District Administration Palamu", responsibleParty: "Government Admin", createdAt: daysAgo(24) },
    { projectId: proj1Id, challengeId: lead.id, stage: "proposal_created", note: "AI draft refined after field visit; approved by reviewers", responsibleParty: "BIT Mesra", createdAt: daysAgo(14) },
    { projectId: proj1Id, challengeId: lead.id, stage: "industry_connected", note: "JalSense Technologies to supply sensor enclosures; CCL CSR to fund recharge pits", responsibleParty: "Industry Exchange", createdAt: daysAgo(9) },
    { projectId: proj1Id, challengeId: lead.id, stage: "prototype", note: "First monitoring unit and recharge pit completed at Bhandaria", responsibleParty: "BIT Mesra", createdAt: daysAgo(2) },
  ]);

  await db.insert(milestones).values([
    { projectId: proj1Id, title: "Baseline survey of 24 handpumps", dueDate: "Week 3", done: true },
    { projectId: proj1Id, title: "Prototype monitor calibrated in lab", dueDate: "Week 8", done: true },
    { projectId: proj1Id, title: "Bhandaria single-site test", dueDate: "Week 12", done: true },
    { projectId: proj1Id, title: "Pilot installation in 3 villages", dueDate: "Week 16", done: false },
    { projectId: proj1Id, title: "One-season pilot evaluation", dueDate: "Week 32", done: false },
  ]);

  await db.insert(messages).values([
    { projectId: proj1Id, author: "Dr. Anjali Verma", role: "Faculty", body: "Infiltration tests show Bhandaria and Namudag sites are suitable for recharge pits. Sarja has hard rock at 1.2 m — we should consider a check dam there instead.", createdAt: daysAgo(10) },
    { projectId: proj1Id, author: "Amit Oraon", role: "Student", body: "Prototype unit reporting every 30 min over GSM. Battery lasted 9 days on cloudy weather test. Adding SMS fallback this week.", createdAt: daysAgo(5) },
    { projectId: proj1Id, author: "JalSense Technologies", role: "Industry", body: "We can supply 30 IP67 enclosures with cable glands at ₹650 each and help with calibration procedure.", createdAt: daysAgo(4) },
    { projectId: proj1Id, author: "Sunil Oraon", role: "Citizen", body: "Village committee formed with 7 members. We can provide labour for digging the pits.", createdAt: daysAgo(3) },
  ]);

  await db.insert(collaborations).values([
    { projectId: proj1Id, industryPartnerId: p["JalSense Technologies"], supportType: "Equipment", note: "Sensor enclosures, calibration support and manufacturing at scale", status: "active", createdAt: daysAgo(9) },
    { projectId: proj1Id, industryPartnerId: p["Coal India CSR (CCL)"], supportType: "Funding", note: "₹6 lakh CSR grant for recharge structures", status: "active", createdAt: daysAgo(9) },
  ]);

  for (const r of waterRows) {
    await db.update(challenges).set({ status: "prototype" }).where(eq(challenges.id, r.id));
    await db.insert(notifications).values({ challengeId: r.id, message: "Your report is part of a project by BIT Mesra. A prototype has been developed at Bhandaria.", createdAt: daysAgo(2) });
  }

  // Project 2: Khunti (completed, impact evaluation)
  await db.update(universityResponses).set({ status: "accepted" }).where(sql`challenge_id = ${khunti.id} and university_id = ${u["BIT Mesra"]}`);
  const [p2Res] = await db.insert(projects).values({
    title: "Handpump Recharge & Solar Pumping — Murhu Block, Khunti", challengeId: khunti.id, clusterId: oldWaterClusterId, universityId: u["BIT Mesra"], category: "Water", stage: "impact_evaluation",
    team: [
      { name: "Dr. Anjali Verma", role: "Faculty mentor", department: "Civil Engineering" },
      { name: "Priya Kumari", role: "Student", department: "Civil Engineering" },
      { name: "Rohit Munda", role: "Student", department: "Environmental Engineering" },
    ],
    impactLevel: "High", feasibilityLevel: "High", costLakh: 9, noveltyLevel: "Low", scalabilityLevel: "High", createdAt: daysAgo(400), updatedAt: daysAgo(30),
  });
  const proj2Id = p2Res.insertId;

  await db.insert(proposals).values({ projectId: proj2Id, isAiDraft: false, approved: true, problemStatement: "Eight villages in Murhu block face 3 months of handpump failure every summer; 4,500 people affected with no alternative source.", proposedSolution: "Recharge pits at 12 handpumps and two solar-powered mini piped schemes from perennial dug wells.", requiredTeam: "Civil Engineering, Environmental Engineering", methodology: "Baseline → design → pilot in 2 villages → deployment in 8 villages", timeline: "12 months", budget: "₹9 lakh", expectedOutcomes: "12 recharge pits, 2 solar schemes, 8 water committees", impactIndicators: "People with reliable water, hours/day availability, shortage days/month", risks: "Geology, maintenance", updatedAt: daysAgo(380) });

  await db.insert(stageHistory).values([
    { projectId: proj2Id, challengeId: khunti.id, stage: "assigned", note: "BIT Mesra assigned", responsibleParty: "Government Admin", createdAt: daysAgo(400) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "proposal_created", note: "Proposal approved", responsibleParty: "BIT Mesra", createdAt: daysAgo(380) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "industry_connected", note: "Tata Steel Foundation funding; SuryaGrid solar pumps", responsibleParty: "Industry Exchange", createdAt: daysAgo(360) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "prototype", note: "First recharge pit and solar scheme at Murhu", responsibleParty: "BIT Mesra", createdAt: daysAgo(320) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "pilot", note: "Pilot in 2 villages through one summer; pit siltation issue fixed with silt trap", responsibleParty: "BIT Mesra", createdAt: daysAgo(280) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "deployed", note: "Deployed in all 8 villages after district approval", responsibleParty: "District Administration Khunti", createdAt: daysAgo(150) },
    { projectId: proj2Id, challengeId: khunti.id, stage: "impact_evaluation", note: "Post-summer measurement completed", responsibleParty: "Platform", createdAt: daysAgo(30) },
  ]);

  await db.insert(milestones).values([
    { projectId: proj2Id, title: "Baseline survey", dueDate: "Month 1", done: true },
    { projectId: proj2Id, title: "Pilot in 2 villages", dueDate: "Month 5", done: true },
    { projectId: proj2Id, title: "Deployment in 8 villages", dueDate: "Month 9", done: true },
    { projectId: proj2Id, title: "Impact measurement after summer", dueDate: "Month 12", done: true },
  ]);

  await db.insert(collaborations).values([
    { projectId: proj2Id, industryPartnerId: p["Tata Steel Foundation"], supportType: "Funding", note: "₹7 lakh CSR grant", status: "active", createdAt: daysAgo(360) },
    { projectId: proj2Id, industryPartnerId: p["SuryaGrid Energy"], supportType: "Equipment", note: "2 solar pumping sets with 3-year maintenance", status: "active", createdAt: daysAgo(360) },
  ]);

  await db.insert(impactRecords).values([
    { projectId: proj2Id, indicator: "Recharge structures & solar schemes installed", unit: "units", kind: "output", beforeValue: 0, afterValue: 14, note: "12 recharge pits + 2 solar schemes" },
    { projectId: proj2Id, indicator: "People receiving reliable summer water", unit: "people", kind: "outcome", beforeValue: 300, afterValue: 4500 },
    { projectId: proj2Id, indicator: "Hours of water availability per day (summer)", unit: "hours", kind: "outcome", beforeValue: 2, afterValue: 8 },
    { projectId: proj2Id, indicator: "Water-shortage days per month (summer)", unit: "days", kind: "outcome", beforeValue: 15, afterValue: 3 },
    { projectId: proj2Id, indicator: "Time spent collecting water per household", unit: "hours/week", kind: "impact", beforeValue: 14, afterValue: 4 },
    { projectId: proj2Id, indicator: "Tanker cost to Block office (summer)", unit: "₹ lakh", kind: "impact", beforeValue: 3.2, afterValue: 0.6 },
  ]);

  await db.insert(messages).values({ projectId: proj2Id, author: "District Administration Khunti", role: "Government", body: "Impact verified by Block office. Recommending replication in Palamu division.", createdAt: daysAgo(28) });

  // Project 3: Gumla Healthcare
  const [gumla] = await db.select().from(challenges).where(eq(challenges.district, "Gumla"));
  if (gumla) {
    await db.update(universityResponses).set({ status: "accepted", note: "Community Medicine department can start next month." }).where(sql`challenge_id = ${gumla.id} and university_id = ${u["RIMS Ranchi"]}`);
    await db.update(challenges).set({ status: "proposal_created" }).where(eq(challenges.id, gumla.id));
    const [p3Res] = await db.insert(projects).values({
      title: "Telemedicine-supported PHC Coverage — Chainpur, Gumla", challengeId: gumla.id, universityId: u["RIMS Ranchi"], category: "Healthcare", stage: "proposal_created",
      team: [
        { name: "Dr. Kavita Sahu", role: "Faculty mentor", department: "Community Medicine" },
        { name: "Pooja Minz", role: "Student", department: "Public Health" },
        { name: "Ritu Xalxo", role: "Student", department: "Computer Science" },
      ],
      impactLevel: "High", feasibilityLevel: "Medium", costLakh: 6, noveltyLevel: "Medium", scalabilityLevel: "High", createdAt: daysAgo(8), updatedAt: daysAgo(3),
    });
    const proj3Id = p3Res.insertId;

    await db.insert(proposals).values({ projectId: proj3Id, isAiDraft: true, approved: false, problemStatement: "Chainpur PHC has had no resident doctor for 6 months; 12,000 people travel 40 km for care and malaria cases are rising.", proposedSolution: "Tele-consultation desk staffed by ANMs with a RIMS doctor roster, rapid malaria test kits, and an IVR follow-up system.", requiredTeam: "Community Medicine, Public Health, Computer Science", methodology: "Baseline OPD data → set up tele-desk → 3-month pilot → evaluate", timeline: "6 months", budget: "₹6 lakh", expectedOutcomes: "Tele-desk operational 6 days/week; 40 consultations/day", impactIndicators: "Patients seen at PHC per week; referral travel distance; malaria case detection time", risks: "Connectivity; doctor roster availability", updatedAt: daysAgo(3) });

    await db.insert(stageHistory).values([
      { projectId: proj3Id, challengeId: gumla.id, stage: "assigned", note: "RIMS Ranchi accepted", responsibleParty: "Government Admin", createdAt: daysAgo(8) },
      { projectId: proj3Id, challengeId: gumla.id, stage: "proposal_created", note: "AI draft generated; under faculty review", responsibleParty: "RIMS Ranchi", createdAt: daysAgo(3) },
    ]);

    await db.insert(milestones).values([
      { projectId: proj3Id, title: "Baseline OPD and referral data", dueDate: "Week 2", done: false },
      { projectId: proj3Id, title: "Tele-desk setup at PHC", dueDate: "Week 6", done: false },
    ]);
  }
}
