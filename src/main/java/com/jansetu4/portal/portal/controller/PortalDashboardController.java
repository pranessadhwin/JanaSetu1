package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class PortalDashboardController {

    private final PortalChallengeRepository challengeRepository;
    private final ProjectRepository projectRepository;
    private final PortalUniversityRepository universityRepository;
    private final IndustryPartnerRepository industryPartnerRepository;
    private final ChallengeClusterRepository clusterRepository;

    private static final List<String> PILOT_STAGES = List.of("pilot", "deployed", "impact_evaluation");

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        List<ChallengeEntity> allChallenges = challengeRepository.findAll();
        List<ProjectEntity> allProjects = projectRepository.findAll();
        List<UniversityEntity> allUnis = universityRepository.findAll();
        List<IndustryPartnerEntity> allIndustry = industryPartnerRepository.findAll();
        List<ChallengeClusterEntity> allClusters = clusterRepository.findAll();

        long totalPopulation = allChallenges.stream()
                .mapToLong(c -> c.getAffectedPopulation() != null ? c.getAffectedPopulation() : 0)
                .sum();

        long pilotsDeployed = allProjects.stream()
                .filter(p -> p.getStage() != null && PILOT_STAGES.contains(p.getStage().toLowerCase()))
                .count();

        // Category distribution
        Map<String, Integer> categoryCounts = new HashMap<>();
        for (ChallengeEntity c : allChallenges) {
            String cat = c.getCategory() != null ? c.getCategory() : "Other";
            categoryCounts.put(cat, categoryCounts.getOrDefault(cat, 0) + 1);
        }

        // Priority distribution
        Map<String, Integer> priorityCounts = new LinkedHashMap<>();
        priorityCounts.put("Critical", 0);
        priorityCounts.put("High", 0);
        priorityCounts.put("Medium", 0);
        priorityCounts.put("Low", 0);
        for (ChallengeEntity c : allChallenges) {
            String pr = c.getPriority() != null ? c.getPriority() : "Low";
            priorityCounts.put(pr, priorityCounts.getOrDefault(pr, 0) + 1);
        }

        // Stage distribution
        Map<String, Integer> stageCounts = new HashMap<>();
        for (ProjectEntity p : allProjects) {
            String st = p.getStage() != null ? p.getStage() : "assigned";
            stageCounts.put(st, stageCounts.getOrDefault(st, 0) + 1);
        }

        // District breakdown
        Map<String, Integer> districtCounts = new HashMap<>();
        for (ChallengeEntity c : allChallenges) {
            String d = c.getDistrict() != null ? c.getDistrict() : "Unknown";
            districtCounts.put(d, districtCounts.getOrDefault(d, 0) + 1);
        }

        List<ChallengeEntity> recentChallenges = allChallenges.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .toList();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalChallenges", allChallenges.size());
        summary.put("totalProjects", allProjects.size());
        summary.put("totalUniversities", allUnis.size());
        summary.put("totalIndustryPartners", allIndustry.size());
        summary.put("totalClusters", allClusters.size());
        summary.put("totalPopulationAffected", totalPopulation);
        summary.put("pilotsDeployed", pilotsDeployed);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("categoryDistribution", categoryCounts);
        result.put("priorityDistribution", priorityCounts);
        result.put("stageDistribution", stageCounts);
        result.put("districtBreakdown", districtCounts);
        result.put("recentChallenges", recentChallenges);

        return ResponseEntity.ok(result);
    }
}
