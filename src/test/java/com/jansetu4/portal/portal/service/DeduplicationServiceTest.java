package com.jansetu4.portal.portal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jansetu4.portal.config.AiConfig;
import com.jansetu4.portal.portal.entity.ChallengeEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class DeduplicationServiceTest {

    private DeduplicationService deduplicationService;

    @BeforeEach
    void setUp() {
        deduplicationService = new DeduplicationService(new AiConfig(), new ObjectMapper());
    }

    @Test
    void testDistanceMetersWithin100m() {
        // Points ~40 meters apart in Ranchi
        double lat1 = 23.34410;
        double lon1 = 85.30950;
        double lat2 = 23.34435;
        double lon2 = 85.30975;

        double distance = DeduplicationService.distanceMeters(lat1, lon1, lat2, lon2);
        assertTrue(distance <= 100.0, "Expected distance <= 100m, got " + distance);
    }

    @Test
    void testDistanceMetersExceeds100m() {
        // Points ~1.5 km apart
        double lat1 = 23.34410;
        double lon1 = 85.30950;
        double lat2 = 23.35700;
        double lon2 = 85.31200;

        double distance = DeduplicationService.distanceMeters(lat1, lon1, lat2, lon2);
        assertTrue(distance > 100.0, "Expected distance > 100m, got " + distance);
    }

    @Test
    void testIsSpatialCandidateWithin100mAndSameCategory() {
        ChallengeEntity a = ChallengeEntity.builder()
                .id(1L)
                .category("Water")
                .district("Ranchi")
                .lat(23.34410)
                .lng(85.30950)
                .build();

        ChallengeEntity b = ChallengeEntity.builder()
                .id(2L)
                .category("Water")
                .district("Ranchi")
                .lat(23.34435)
                .lng(85.30975)
                .build();

        assertTrue(deduplicationService.isSpatialCandidate(a, b), "Issues within 100m of same category must be candidates");
    }

    @Test
    void testIsSpatialCandidateDifferentCategoryRejected() {
        ChallengeEntity a = ChallengeEntity.builder()
                .id(1L)
                .category("Water")
                .district("Ranchi")
                .lat(23.34410)
                .lng(85.30950)
                .build();

        ChallengeEntity b = ChallengeEntity.builder()
                .id(2L)
                .category("Healthcare")
                .district("Ranchi")
                .lat(23.34435)
                .lng(85.30975)
                .build();

        assertFalse(deduplicationService.isSpatialCandidate(a, b), "Different categories should not be candidates");
    }

    @Test
    void testAiOrLexicalVerificationDuplicate() {
        ChallengeEntity a = ChallengeEntity.builder()
                .id(1L)
                .title("Broken water pipeline leaking clean water")
                .description("The main pipeline has burst near the crossroad and water is overflowing.")
                .village("Namkum")
                .block("Namkum")
                .district("Ranchi")
                .category("Water")
                .build();

        ChallengeEntity b = ChallengeEntity.builder()
                .id(2L)
                .title("Water pipeline burst at crossroad")
                .description("Drinking water pipeline has broken and flooding the road.")
                .village("Namkum")
                .block("Namkum")
                .district("Ranchi")
                .category("Water")
                .build();

        DeduplicationService.AiDuplicateCheckResult res = deduplicationService.checkWithAi(a, b);
        assertTrue(res.isDuplicate(), "Expected reports describing the same broken pipeline to be duplicates");
    }

    @Test
    void testExactTitleMatchInSameDistrict() {
        ChallengeEntity existing = ChallengeEntity.builder()
                .id(1L)
                .title("Broken water pipeline in Kanke")
                .description("Drinking water has been leaking on the street for 3 days.")
                .district("Ranchi")
                .category("Water")
                .build();

        Optional<DeduplicationService.DuplicateMatch> match = deduplicationService.findDuplicate(
                "Broken water pipeline in Kanke",
                "Water leaking everywhere",
                "Ranchi",
                "Water",
                List.of(existing)
        );

        assertTrue(match.isPresent(), "Exact title in same district should be detected as duplicate");
        assertEquals(1L, match.get().challenge().getId());
    }

    @Test
    void testDifferentDistrictNotDuplicate() {
        ChallengeEntity existing = ChallengeEntity.builder()
                .id(1L)
                .title("Broken water pipeline in Kanke")
                .description("Drinking water has been leaking on the street for 3 days.")
                .district("Dhanbad")
                .category("Water")
                .build();

        Optional<DeduplicationService.DuplicateMatch> match = deduplicationService.findDuplicate(
                "Broken water pipeline in Kanke",
                "Water leaking everywhere",
                "Ranchi",
                "Water",
                List.of(existing)
        );

        assertTrue(match.isEmpty(), "Different districts should not be matched as duplicate");
    }

    @Test
    void testHighOverlapInContentAndSameCategory() {
        ChallengeEntity existing = ChallengeEntity.builder()
                .id(2L)
                .title("Primary health center has no doctor or medicines")
                .description("Villagers in Angara have to travel 35km to the city hospital because the primary health center has no doctor.")
                .district("Ranchi")
                .category("Healthcare")
                .build();

        Optional<DeduplicationService.DuplicateMatch> match = deduplicationService.findDuplicate(
                "No doctor at Angara health center",
                "The health center in Angara has no doctor and no medicines, villagers must travel 35km.",
                "Ranchi",
                "Healthcare",
                List.of(existing)
        );

        assertTrue(match.isPresent(), "High content overlap in same district and category should be detected as duplicate");
        assertEquals(2L, match.get().challenge().getId());
    }

    @Test
    void testCompletelyDifferentIssuesNotDuplicate() {
        ChallengeEntity existing = ChallengeEntity.builder()
                .id(3L)
                .title("Bridge washed away by flood")
                .description("The culvert bridge collapsed after heavy rains.")
                .district("Ranchi")
                .category("Infrastructure")
                .build();

        Optional<DeduplicationService.DuplicateMatch> match = deduplicationService.findDuplicate(
                "Solar street lamps not working",
                "All 12 solar panels and batteries were damaged in storm.",
                "Ranchi",
                "Energy",
                List.of(existing)
        );

        assertTrue(match.isEmpty(), "Unrelated issues should not be matched as duplicate");
    }
}
