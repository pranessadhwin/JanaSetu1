package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProposalDraftingService {

    public Map<String, Object> draftProposal(ChallengeEntity challenge, ChallengeClusterEntity cluster,
                                             int clusterSize, UniversityEntity university,
                                             List<Map<String, Object>> team, List<KnowledgeItemEntity> references) {
        String problemStatement = String.format(
                "Problem Statement:\nIn %s, %s (District: %s), %d citizens are severely affected by %s.\n" +
                        "Current status: %s. Urgency indicators: %s.\n" +
                        "This proposal addresses a cluster of %d recurring incidents reported across the region.",
                challenge.getVillage() != null && !challenge.getVillage().isEmpty() ? challenge.getVillage() : "rural community",
                challenge.getBlock() != null && !challenge.getBlock().isEmpty() ? challenge.getBlock() : "block",
                challenge.getDistrict(),
                challenge.getAffectedPopulation() != null ? challenge.getAffectedPopulation() : 0,
                challenge.getTitle(),
                challenge.getDescription(),
                challenge.getUrgencyKeywords() != null && !challenge.getUrgencyKeywords().isEmpty()
                        ? String.join(", ", challenge.getUrgencyKeywords()) : "seasonal stress",
                clusterSize
        );

        String proposedSolution = String.format(
                "Proposed Technological Intervention:\n" +
                        "A multidisciplinary team from %s (%s) will develop, prototype and field-pilot an affordable, sustainable engineering solution.\n" +
                        "Key Innovation Pillars:\n" +
                        "1. Localized design leveraging regional materials and vernacular architecture to keep deployment costs under schedule rates.\n" +
                        "2. IoT-enabled telemetric monitoring for real-time performance, water quality/stress telemetry, and predictive maintenance.\n" +
                        "3. Community capacity building and Panchayati Raj transfer for sustained grassroots ownership.",
                university != null ? university.getName() : "Partner University",
                university != null ? university.getShortName() : "Univ"
        );

        StringBuilder teamDesc = new StringBuilder("Proposed Research Team & Allocation:\n");
        if (team != null && !team.isEmpty()) {
            for (Map<String, Object> member : team) {
                teamDesc.append(String.format("• %s (%s, %s) — Lead Domain Investigator\n",
                        member.get("name"), member.get("role"), member.get("department")));
            }
        } else {
            teamDesc.append("• Senior Faculty Lead (Principal Investigator)\n• Graduate Research Fellows (Prototype Fabrication)\n• Student Field Interns (Community Piloting)");
        }

        String methodology = "Work Plan & Methodology:\n" +
                "Phase 1: Baseline Site Survey & Hydrogeological/Field Diagnostic (Weeks 1–4)\n" +
                "Phase 2: Laboratory CAD/Simulation & Iterative Prototype Fabrication (Weeks 5–10)\n" +
                "Phase 3: Alpha Testing & Community Validation Workshop with Gram Sabha (Weeks 11–14)\n" +
                "Phase 4: Field Pilot Installation & Telemetry Deployment (Weeks 15–20)\n" +
                "Phase 5: Impact Measurement, Protocol Handover & District Scale-up Report (Weeks 21–24)";

        String timeline = "Total Project Duration: 6 Months (24 Weeks)\n" +
                "• Milestone 1: Diagnostic & Site Characterization (Month 1)\n" +
                "• Milestone 2: Functional Prototype Validation (Month 2.5)\n" +
                "• Milestone 3: Field Pilot Commissioning (Month 4.5)\n" +
                "• Milestone 4: Final Impact Evaluation & Handover (Month 6)";

        String budget = "Budget Estimate (Total: ₹4.80 Lakh):\n" +
                "• Hardware Components & Raw Materials: ₹2,10,000\n" +
                "• Fabrication, Machining & Testing: ₹95,000\n" +
                "• Field Deployment, Logistics & Local Labor: ₹85,000\n" +
                "• IoT Sensors & Connectivity (1-year telemetry): ₹40,000\n" +
                "• Community Training, Signage & Handover Protocol: ₹50,000";

        String expectedOutcomes = String.format(
                "Expected Outcomes:\n" +
                        "• Direct relief and restored reliability for %d affected villagers.\n" +
                        "• Fully documented Open-Hardware blueprint reusable across the %s district cluster.\n" +
                        "• 1 Student patent or research publication in an applied rural technology journal.",
                challenge.getAffectedPopulation() != null ? challenge.getAffectedPopulation() : 0,
                challenge.getDistrict()
        );

        String impactIndicators = "Primary Verification Metrics:\n" +
                "• Uptime / Reliability: >90% operational continuity through peak dry season.\n" +
                "• Travel / Wait Time Reduction: Decrease average fetching time by at least 60%.\n" +
                "• Maintenance Cost: Sub-₹500 per month manageable by Village Water & Sanitation Committee (VWSC).";

        String risks = "Risk Analysis & Mitigation:\n" +
                "• Seasonal Delays (Monsoon): Schedule physical civil works before peak rains.\n" +
                "• Spares & Consumables: Use off-the-shelf local hardware items accessible at block bazaar.\n" +
                "• Power Outages: Include solar DC backup with battery buffer.";

        Map<String, Object> map = new HashMap<>();
        map.put("problemStatement", problemStatement);
        map.put("proposedSolution", proposedSolution);
        map.put("requiredTeam", teamDesc.toString());
        map.put("methodology", methodology);
        map.put("timeline", timeline);
        map.put("budget", budget);
        map.put("expectedOutcomes", expectedOutcomes);
        map.put("impactIndicators", impactIndicators);
        map.put("risks", risks);

        return map;
    }
}
