package com.jansetu4.portal.portal.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PriorityScoringService {

    @Getter
    @Builder
    public static class PriorityInput {
        private String category;
        private int affectedPopulation;
        private boolean hasAlternative;
        private String frequency;
        private List<String> vulnerableGroups;
        private List<String> urgencyKeywords;
        private int clusterSize;
        private int clusterDistricts;
    }

    @Getter
    @AllArgsConstructor
    public static class PriorityResult {
        private String priority;
        private List<String> reasons;
        private int points;
    }

    private static final List<String> GOVT_PRIORITY_SECTORS = List.of("Water", "Healthcare", "Agriculture");

    public PriorityResult computePriority(PriorityInput input) {
        List<String> reasons = new ArrayList<>();
        int points = 0;
        NumberFormat nf = NumberFormat.getInstance(new Locale("en", "IN"));

        // Population
        if (input.getAffectedPopulation() >= 5000) {
            points += 3;
            reasons.add("Large population affected (" + nf.format(input.getAffectedPopulation()) + " people)");
        } else if (input.getAffectedPopulation() >= 1000) {
            points += 2;
            reasons.add("Significant population affected (" + nf.format(input.getAffectedPopulation()) + " people)");
        } else if (input.getAffectedPopulation() >= 100) {
            points += 1;
            reasons.add(nf.format(input.getAffectedPopulation()) + " people affected");
        }

        // Urgency
        if (input.getUrgencyKeywords() != null && !input.getUrgencyKeywords().isEmpty()) {
            points += 2;
            reasons.add("Urgency signals detected: " + String.join(", ", input.getUrgencyKeywords().stream().limit(3).toList()));
        }

        // Alternative
        if (!input.isHasAlternative()) {
            points += 2;
            reasons.add("No alternative source or fallback available");
        }

        // Vulnerable groups
        if (input.getVulnerableGroups() != null && !input.getVulnerableGroups().isEmpty()) {
            points += Math.min(2, input.getVulnerableGroups().size());
            reasons.add("Vulnerable groups affected: " + String.join(", ", input.getVulnerableGroups()));
        }

        // Frequency
        if ("constant".equalsIgnoreCase(input.getFrequency())) {
            points += 2;
            reasons.add("Persistent / constant problem");
        } else if ("seasonal".equalsIgnoreCase(input.getFrequency())) {
            points += 1;
            reasons.add("Problem recurs every season");
        }

        // Govt priority sector
        if (GOVT_PRIORITY_SECTORS.contains(input.getCategory())) {
            points += 1;
            reasons.add(input.getCategory() + " is a government priority sector");
        }

        // Cluster size
        if (input.getClusterSize() >= 5) {
            points += 3;
            reasons.add("Systemic problem: cluster of " + input.getClusterSize() + " similar reports");
        } else if (input.getClusterSize() >= 2) {
            points += 1;
            reasons.add("Recurring in area (" + input.getClusterSize() + " related reports)");
        }

        String priority;
        if (points >= 8) priority = "Critical";
        else if (points >= 5) priority = "High";
        else if (points >= 3) priority = "Medium";
        else priority = "Low";

        return new PriorityResult(priority, reasons, points);
    }
}
