package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import com.jansetu4.portal.portal.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class PortalChallengeController {

    private final PortalChallengeRepository challengeRepository;
    private final ChallengeClusterRepository clusterRepository;
    private final UniversityResponseRepository universityResponseRepository;
    private final PortalUniversityRepository universityRepository;
    private final StageHistoryRepository stageHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectRepository projectRepository;
    private final PersonRepository personRepository;

    private final PortalClassificationService classificationService;
    private final PriorityScoringService priorityScoringService;
    private final ClusteringService clusteringService;
    private final UniversityMatchingService matchingService;
    private final DistrictService districtService;

    @GetMapping
    public ResponseEntity<List<ChallengeEntity>> getChallenges(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String status
    ) {
        List<ChallengeEntity> list = challengeRepository.findAllByOrderByCreatedAtDesc();

        if (category != null && !category.isBlank()) {
            list = list.stream().filter(c -> c.getCategory().equalsIgnoreCase(category.trim())).toList();
        }
        if (priority != null && !priority.isBlank()) {
            list = list.stream().filter(c -> c.getPriority().equalsIgnoreCase(priority.trim())).toList();
        }
        if (district != null && !district.isBlank()) {
            list = list.stream().filter(c -> c.getDistrict().equalsIgnoreCase(district.trim())).toList();
        }
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(c -> c.getStatus().equalsIgnoreCase(status.trim())).toList();
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getChallengeById(@PathVariable Long id) {
        Optional<ChallengeEntity> opt = challengeRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Challenge not found"));
        }
        ChallengeEntity challenge = opt.get();

        ChallengeClusterEntity cluster = null;
        List<ChallengeEntity> clusterMembers = new ArrayList<>();
        if (challenge.getClusterId() != null) {
            cluster = clusterRepository.findById(challenge.getClusterId()).orElse(null);
            clusterMembers = challengeRepository.findByClusterId(challenge.getClusterId());
        }

        List<UniversityResponseEntity> responses = universityResponseRepository.findByChallengeId(id);
        Map<Long, UniversityEntity> uniMap = universityRepository.findAll().stream()
                .collect(Collectors.toMap(UniversityEntity::getId, u -> u, (a, b) -> a));

        List<Map<String, Object>> enrichedResponses = responses.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("challengeId", r.getChallengeId());
            map.put("universityId", r.getUniversityId());
            map.put("status", r.getStatus());
            map.put("note", r.getNote());
            map.put("matchReasons", r.getMatchReasons());
            map.put("createdAt", r.getCreatedAt());
            map.put("university", uniMap.get(r.getUniversityId()));
            return map;
        }).toList();

        List<StageHistoryEntity> history = stageHistoryRepository.findByChallengeIdOrderByCreatedAtDesc(id);
        List<NotificationEntity> notifs = notificationRepository.findByChallengeIdOrderByCreatedAtDesc(id);
        ProjectEntity project = projectRepository.findByChallengeId(id).orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("challenge", challenge);
        result.put("cluster", cluster);
        result.put("clusterMembers", clusterMembers);
        result.put("universityResponses", enrichedResponses);
        result.put("stageHistory", history);
        result.put("notifications", notifs);
        result.put("project", project);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createChallenge(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String district = (String) payload.get("district");
        String forcedCategory = (String) payload.get("category");
        String block = payload.get("block") != null ? (String) payload.get("block") : "";
        String village = payload.get("village") != null ? (String) payload.get("village") : "";
        String reporterName = payload.get("reporterName") != null ? (String) payload.get("reporterName") : "Anonymous";
        String reporterType = payload.get("reporterType") != null ? (String) payload.get("reporterType") : "Citizen";

        if (title == null || title.isBlank() || description == null || description.isBlank() || district == null || district.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title, description and district are required."));
        }

        // 1. Classification
        PortalClassificationService.ClassificationResult cls = classificationService.classify(title, description, forcedCategory);

        int pop = 0;
        if (payload.get("affectedPopulation") != null) {
            try {
                pop = Integer.parseInt(payload.get("affectedPopulation").toString());
            } catch (Exception ignored) {}
        }

        boolean alt = true;
        if (payload.get("hasAlternative") != null) {
            alt = Boolean.parseBoolean(payload.get("hasAlternative").toString());
        } else if (cls.getAlternativeHint() != null) {
            alt = cls.getAlternativeHint();
        }

        String freq = payload.get("frequency") != null ? (String) payload.get("frequency") : cls.getFrequencyHint();

        @SuppressWarnings("unchecked")
        List<String> reqVul = (List<String>) payload.get("vulnerableGroups");
        Set<String> vulSet = new HashSet<>(cls.getVulnerableGroups());
        if (reqVul != null) vulSet.addAll(reqVul);
        List<String> vulList = new ArrayList<>(vulSet);

        // 2. Clustering
        ChallengeClusterEntity cluster = clusteringService.findOrCreateCluster(cls.getCategory(), cls.getSubTags().get(0), district);
        List<ChallengeEntity> clusterMembers = challengeRepository.findByClusterId(cluster.getId());
        int clusterSize = clusterMembers.size() + 1;

        // 3. Priority calculation
        PriorityScoringService.PriorityResult pr = priorityScoringService.computePriority(
                PriorityScoringService.PriorityInput.builder()
                        .category(cls.getCategory())
                        .affectedPopulation(pop)
                        .hasAlternative(alt)
                        .frequency(freq)
                        .vulnerableGroups(vulList)
                        .urgencyKeywords(cls.getUrgencyKeywords())
                        .clusterSize(clusterSize)
                        .clusterDistricts(1)
                        .build()
        );

        // Coordinates
        Double lat = null;
        Double lng = null;
        if (payload.get("lat") != null) {
            try { lat = Double.parseDouble(payload.get("lat").toString()); } catch (Exception ignored) {}
        }
        if (payload.get("lng") != null) {
            try { lng = Double.parseDouble(payload.get("lng").toString()); } catch (Exception ignored) {}
        }
        if (lat == null || lng == null) {
            districtService.getDistrict(district).ifPresent(d -> {
                // Jitter slightly so markers don't overlap exactly
                double jitterLat = d.getLat() + (Math.random() - 0.5) * 0.1;
                double jitterLng = d.getLng() + (Math.random() - 0.5) * 0.1;
            });
            Optional<DistrictService.DistrictInfo> dOpt = districtService.getDistrict(district);
            if (dOpt.isPresent()) {
                lat = dOpt.get().getLat() + (Math.random() - 0.5) * 0.1;
                lng = dOpt.get().getLng() + (Math.random() - 0.5) * 0.1;
            }
        }

        @SuppressWarnings("unchecked")
        List<String> attachments = payload.get("attachments") != null
                ? (List<String>) payload.get("attachments")
                : new ArrayList<>();

        ChallengeEntity challenge = ChallengeEntity.builder()
                .title(title.trim())
                .description(description.trim())
                .summary(cls.getSummary())
                .category(cls.getCategory())
                .subTags(cls.getSubTags())
                .district(district.trim())
                .block(block)
                .village(village)
                .lat(lat)
                .lng(lng)
                .affectedPopulation(pop)
                .hasAlternative(alt)
                .frequency(freq)
                .vulnerableGroups(vulList)
                .urgencyKeywords(cls.getUrgencyKeywords())
                .priority(pr.getPriority())
                .priorityReasons(pr.getReasons())
                .status("categorized")
                .clusterId(cluster.getId())
                .reporterName(reporterName)
                .reporterType(reporterType)
                .attachments(attachments)
                .createdAt(Instant.now())
                .build();

        ChallengeEntity saved = challengeRepository.save(challenge);

        // Stage history
        stageHistoryRepository.save(StageHistoryEntity.builder()
                .challengeId(saved.getId())
                .stage("submitted")
                .note("Reported by " + reporterName)
                .responsibleParty(reporterType)
                .createdAt(Instant.now())
                .build());

        stageHistoryRepository.save(StageHistoryEntity.builder()
                .challengeId(saved.getId())
                .stage("validated")
                .note("Location and description verified")
                .responsibleParty("Platform")
                .createdAt(Instant.now())
                .build());

        stageHistoryRepository.save(StageHistoryEntity.builder()
                .challengeId(saved.getId())
                .stage("categorized")
                .note("Classified as " + cls.getCategory() + " → " + cls.getSubTags().get(0) + "; priority " + pr.getPriority())
                .responsibleParty("Intelligence Engine")
                .createdAt(Instant.now())
                .build());

        notificationRepository.save(NotificationEntity.builder()
                .challengeId(saved.getId())
                .message("Your issue was classified under " + cls.getCategory() + " with " + pr.getPriority() + " priority. Nearby universities are being matched.")
                .createdAt(Instant.now())
                .build());

        // Match universities
        List<UniversityEntity> allUnis = universityRepository.findAll();
        List<PersonEntity> allPeople = personRepository.findAll();
        List<UniversityMatchingService.UniversityMatch> matches = matchingService.matchUniversities(
                cls.getCategory(), cls.getSubTags(), district, allUnis, allPeople, 5
        );

        for (UniversityMatchingService.UniversityMatch match : matches) {
            universityResponseRepository.save(UniversityResponseEntity.builder()
                    .challengeId(saved.getId())
                    .universityId(match.getUniversity().getId())
                    .status("shortlisted")
                    .note("")
                    .matchReasons(match.getReasons())
                    .createdAt(Instant.now())
                    .build());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assignChallenge(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ChallengeEntity> cOpt = challengeRepository.findById(id);
        if (cOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Challenge not found"));
        }
        ChallengeEntity challenge = cOpt.get();

        Long universityId = Long.parseLong(payload.get("universityId").toString());
        String note = payload.get("note") != null ? (String) payload.get("note") : "Accepted project assignment";

        Optional<UniversityEntity> uOpt = universityRepository.findById(universityId);
        if (uOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "University not found"));
        }
        UniversityEntity university = uOpt.get();

        // Update response
        Optional<UniversityResponseEntity> rOpt = universityResponseRepository.findByChallengeIdAndUniversityId(id, universityId);
        if (rOpt.isPresent()) {
            UniversityResponseEntity resp = rOpt.get();
            resp.setStatus("accepted");
            resp.setNote(note);
            universityResponseRepository.save(resp);
        }

        // Update challenge status
        challenge.setStatus("assigned");
        challengeRepository.save(challenge);

        // Create Project
        ProjectEntity project = ProjectEntity.builder()
                .title(challenge.getTitle() + " — Solution Project")
                .challengeId(id)
                .clusterId(challenge.getClusterId())
                .universityId(universityId)
                .category(challenge.getCategory())
                .stage("assigned")
                .team(new ArrayList<>())
                .impactLevel("High")
                .feasibilityLevel("Medium")
                .costLakh(5)
                .noveltyLevel("Medium")
                .scalabilityLevel("High")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        ProjectEntity savedProject = projectRepository.save(project);

        stageHistoryRepository.save(StageHistoryEntity.builder()
                .projectId(savedProject.getId())
                .challengeId(id)
                .stage("assigned")
                .note("Assigned to " + university.getName() + ". Faculty team mobilised.")
                .responsibleParty("District Administration")
                .createdAt(Instant.now())
                .build());

        notificationRepository.save(NotificationEntity.builder()
                .challengeId(id)
                .message("Your challenge has been assigned to " + university.getName() + "! An R&D team is being assembled.")
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(Map.of("success", true, "projectId", savedProject.getId()));
    }
}
