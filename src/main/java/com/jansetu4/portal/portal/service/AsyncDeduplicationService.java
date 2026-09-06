package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.ChallengeEntity;
import com.jansetu4.portal.portal.entity.NotificationEntity;
import com.jansetu4.portal.portal.entity.StageHistoryEntity;
import com.jansetu4.portal.portal.repository.NotificationRepository;
import com.jansetu4.portal.portal.repository.PortalChallengeRepository;
import com.jansetu4.portal.portal.repository.StageHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncDeduplicationService {

    private final PortalChallengeRepository challengeRepository;
    private final StageHistoryRepository stageHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final DeduplicationService deduplicationService;

    /**
     * Runs asynchronously in the background after a challenge is created.
     * Evaluates spatial proximity (< 100 meters) and category, then uses AI
     * to verify if the issues refer to the exact same real-world problem.
     * If duplicate is confirmed, auto-merges and upvotes the primary issue.
     */
    @Async
    public CompletableFuture<Void> checkAndMergeIfDuplicate(Long newChallengeId) {
        try {
            Optional<ChallengeEntity> newOpt = challengeRepository.findById(newChallengeId);
            if (newOpt.isEmpty()) {
                return CompletableFuture.completedFuture(null);
            }
            ChallengeEntity newChallenge = newOpt.get();

            List<ChallengeEntity> districtCandidates = challengeRepository.findByDistrictIgnoreCase(newChallenge.getDistrict());

            for (ChallengeEntity candidate : districtCandidates) {
                if (candidate.getId().equals(newChallenge.getId())) {
                    continue;
                }
                if ("merged".equalsIgnoreCase(candidate.getStatus())) {
                    continue;
                }

                // 1. Spatial proximity (< 100m) & same category filter
                if (deduplicationService.isSpatialCandidate(newChallenge, candidate)) {
                    log.info("Candidate within 100m found: Challenge #{} and #{} (category: {})",
                            newChallenge.getId(), candidate.getId(), newChallenge.getCategory());

                    // 2. AI Duplicate Verification
                    DeduplicationService.AiDuplicateCheckResult aiResult =
                            deduplicationService.checkWithAi(newChallenge, candidate);

                    if (aiResult.isDuplicate() && aiResult.confidence() >= 0.6) {
                        log.info("AI confirmed duplicate between #{} and #{}: {}",
                                newChallenge.getId(), candidate.getId(), aiResult.reason());

                        // 3. Auto-merge: update primary candidate
                        candidate.setUpvotes(candidate.getUpvotes() + 1);
                        candidate.setReportCount(candidate.getReportCount() + 1);
                        if (newChallenge.getAffectedPopulation() != null &&
                                (candidate.getAffectedPopulation() == null || newChallenge.getAffectedPopulation() > candidate.getAffectedPopulation())) {
                            candidate.setAffectedPopulation(newChallenge.getAffectedPopulation());
                        }
                        challengeRepository.save(candidate);

                        // Mark new challenge as merged
                        newChallenge.setStatus("merged");
                        newChallenge.setDuplicateOfId(candidate.getId());
                        challengeRepository.save(newChallenge);

                        // Stage history audit records
                        stageHistoryRepository.save(StageHistoryEntity.builder()
                                .challengeId(newChallenge.getId())
                                .stage("merged")
                                .note("AI confirmed matching issue within 100m of report #" + candidate.getId()
                                        + " (" + aiResult.reason() + "). Merged into primary report.")
                                .responsibleParty("AI Deduplication Engine")
                                .createdAt(Instant.now())
                                .build());

                        stageHistoryRepository.save(StageHistoryEntity.builder()
                                .challengeId(candidate.getId())
                                .stage(candidate.getStatus())
                                .note("AI linked duplicate report #" + newChallenge.getId()
                                        + " reported within 100m (" + aiResult.reason()
                                        + "). Upvotes updated to " + candidate.getUpvotes() + ".")
                                .responsibleParty("AI Deduplication Engine")
                                .createdAt(Instant.now())
                                .build());

                        // Notifications
                        notificationRepository.save(NotificationEntity.builder()
                                .challengeId(newChallenge.getId())
                                .message("Your report matches an existing report #" + candidate.getId()
                                        + " within 100m. It has been merged and registered as an upvote.")
                                .createdAt(Instant.now())
                                .build());

                        notificationRepository.save(NotificationEntity.builder()
                                .challengeId(candidate.getId())
                                .message("A citizen reported a matching issue within 100m. Your report received an additional upvote (Total: "
                                        + candidate.getUpvotes() + ").")
                                .createdAt(Instant.now())
                                .build());

                        break; // Merged into the primary matching issue
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Async deduplication error for challenge #{}: {}", newChallengeId, ex.getMessage(), ex);
        }
        return CompletableFuture.completedFuture(null);
    }
}
