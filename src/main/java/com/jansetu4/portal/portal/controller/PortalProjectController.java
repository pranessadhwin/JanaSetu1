package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import com.jansetu4.portal.portal.service.ProposalDraftingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class PortalProjectController {

    private final ProjectRepository projectRepository;
    private final PortalChallengeRepository challengeRepository;
    private final PortalUniversityRepository universityRepository;
    private final ProposalRepository proposalRepository;
    private final MilestoneRepository milestoneRepository;
    private final StageHistoryRepository stageHistoryRepository;
    private final MessageRepository messageRepository;
    private final CollaborationRepository collaborationRepository;
    private final IndustryPartnerRepository industryPartnerRepository;
    private final ImpactRecordRepository impactRecordRepository;
    private final PersonRepository personRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final ChallengeClusterRepository clusterRepository;

    private final ProposalDraftingService proposalDraftingService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getProjects(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String category
    ) {
        List<ProjectEntity> projects = projectRepository.findAllByOrderByUpdatedAtDesc();
        Map<Long, UniversityEntity> uniMap = universityRepository.findAll().stream()
                .collect(Collectors.toMap(UniversityEntity::getId, u -> u, (a, b) -> a));

        if (stage != null && !stage.isBlank()) {
            projects = projects.stream().filter(p -> p.getStage().equalsIgnoreCase(stage.trim())).toList();
        }
        if (category != null && !category.isBlank()) {
            projects = projects.stream().filter(p -> p.getCategory().equalsIgnoreCase(category.trim())).toList();
        }

        List<Map<String, Object>> result = projects.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("challengeId", p.getChallengeId());
            map.put("clusterId", p.getClusterId());
            map.put("universityId", p.getUniversityId());
            map.put("category", p.getCategory());
            map.put("stage", p.getStage());
            map.put("team", p.getTeam());
            map.put("impactLevel", p.getImpactLevel());
            map.put("feasibilityLevel", p.getFeasibilityLevel());
            map.put("costLakh", p.getCostLakh());
            map.put("noveltyLevel", p.getNoveltyLevel());
            map.put("scalabilityLevel", p.getScalabilityLevel());
            map.put("createdAt", p.getCreatedAt());
            map.put("updatedAt", p.getUpdatedAt());
            map.put("university", uniMap.get(p.getUniversityId()));
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        Optional<ProjectEntity> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }
        ProjectEntity project = opt.get();

        ChallengeEntity challenge = challengeRepository.findById(project.getChallengeId()).orElse(null);
        UniversityEntity university = universityRepository.findById(project.getUniversityId()).orElse(null);
        ProposalEntity proposal = proposalRepository.findByProjectId(id).orElse(null);

        List<MilestoneEntity> milestones = milestoneRepository.findByProjectId(id);
        List<StageHistoryEntity> history = stageHistoryRepository.findByProjectIdOrderByCreatedAtDesc(id);
        List<MessageEntity> messages = messageRepository.findByProjectIdOrderByCreatedAtDesc(id);

        List<CollaborationEntity> collabList = collaborationRepository.findByProjectId(id);
        Map<Long, IndustryPartnerEntity> partnerMap = industryPartnerRepository.findAll().stream()
                .collect(Collectors.toMap(IndustryPartnerEntity::getId, p -> p, (a, b) -> a));

        List<Map<String, Object>> enrichedCollabs = collabList.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("projectId", c.getProjectId());
            map.put("industryPartnerId", c.getIndustryPartnerId());
            map.put("supportType", c.getSupportType());
            map.put("note", c.getNote());
            map.put("status", c.getStatus());
            map.put("createdAt", c.getCreatedAt());
            map.put("partner", partnerMap.get(c.getIndustryPartnerId()));
            return map;
        }).toList();

        List<ImpactRecordEntity> impacts = impactRecordRepository.findByProjectId(id);

        List<PersonEntity> uniPeople = personRepository.findByUniversityId(project.getUniversityId());
        List<Map<String, Object>> suggestedTeam = uniPeople.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("role", p.getRole());
            m.put("department", p.getDepartment());
            m.put("skills", p.getSkills());
            return m;
        }).toList();

        List<IndustryPartnerEntity> allPartners = industryPartnerRepository.findAll();

        Map<String, Object> result = new HashMap<>();
        result.put("project", project);
        result.put("challenge", challenge);
        result.put("university", university);
        result.put("proposal", proposal);
        result.put("milestones", milestones);
        result.put("stageHistory", history);
        result.put("messages", messages);
        result.put("collaborations", enrichedCollabs);
        result.put("impactRecords", impacts);
        result.put("suggestedTeam", suggestedTeam);
        result.put("availableIndustryPartners", allPartners);

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<?> updateStage(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ProjectEntity> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }
        ProjectEntity project = opt.get();

        String stage = (String) payload.get("stage");
        String note = (String) payload.get("note");
        String responsibleParty = (String) payload.get("responsibleParty");

        project.setStage(stage);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);

        // Update challenge status as well
        challengeRepository.findById(project.getChallengeId()).ifPresent(c -> {
            c.setStatus(stage);
            challengeRepository.save(c);
        });

        stageHistoryRepository.save(StageHistoryEntity.builder()
                .projectId(id)
                .challengeId(project.getChallengeId())
                .stage(stage)
                .note(note != null && !note.isBlank() ? note : "Progressed to " + stage)
                .responsibleParty(responsibleParty != null && !responsibleParty.isBlank() ? responsibleParty : "University Team")
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(Map.of("success", true, "stage", stage));
    }

    @PostMapping("/{id}/proposal/draft")
    public ResponseEntity<?> draftProposal(@PathVariable Long id) {
        Optional<ProjectEntity> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }
        ProjectEntity project = opt.get();

        ChallengeEntity challenge = challengeRepository.findById(project.getChallengeId()).orElse(null);
        UniversityEntity university = universityRepository.findById(project.getUniversityId()).orElse(null);

        if (challenge == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Challenge not found"));
        }

        ChallengeClusterEntity cluster = null;
        int clusterSize = 1;
        if (challenge.getClusterId() != null) {
            cluster = clusterRepository.findById(challenge.getClusterId()).orElse(null);
            clusterSize = challengeRepository.findByClusterId(challenge.getClusterId()).size();
        }

        List<KnowledgeItemEntity> kb = knowledgeBaseRepository.findByCategory(challenge.getCategory());

        List<PersonEntity> uniPeople = personRepository.findByUniversityId(project.getUniversityId());
        List<Map<String, Object>> team = uniPeople.stream().limit(3).map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", p.getName());
            m.put("role", p.getRole());
            m.put("department", p.getDepartment());
            return m;
        }).toList();

        Map<String, Object> drafted = proposalDraftingService.draftProposal(
                challenge, cluster, clusterSize, university, team, kb
        );

        Optional<ProposalEntity> existingOpt = proposalRepository.findByProjectId(id);
        ProposalEntity proposal;
        if (existingOpt.isPresent()) {
            proposal = existingOpt.get();
            proposal.setProblemStatement((String) drafted.get("problemStatement"));
            proposal.setProposedSolution((String) drafted.get("proposedSolution"));
            proposal.setRequiredTeam((String) drafted.get("requiredTeam"));
            proposal.setMethodology((String) drafted.get("methodology"));
            proposal.setTimeline((String) drafted.get("timeline"));
            proposal.setBudget((String) drafted.get("budget"));
            proposal.setExpectedOutcomes((String) drafted.get("expectedOutcomes"));
            proposal.setImpactIndicators((String) drafted.get("impactIndicators"));
            proposal.setRisks((String) drafted.get("risks"));
            proposal.setIsAiDraft(true);
            proposal.setUpdatedAt(Instant.now());
        } else {
            proposal = ProposalEntity.builder()
                    .projectId(id)
                    .problemStatement((String) drafted.get("problemStatement"))
                    .proposedSolution((String) drafted.get("proposedSolution"))
                    .requiredTeam((String) drafted.get("requiredTeam"))
                    .methodology((String) drafted.get("methodology"))
                    .timeline((String) drafted.get("timeline"))
                    .budget((String) drafted.get("budget"))
                    .expectedOutcomes((String) drafted.get("expectedOutcomes"))
                    .impactIndicators((String) drafted.get("impactIndicators"))
                    .risks((String) drafted.get("risks"))
                    .isAiDraft(true)
                    .approved(false)
                    .updatedAt(Instant.now())
                    .build();
        }

        ProposalEntity saved = proposalRepository.save(proposal);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/proposal")
    public ResponseEntity<?> saveProposal(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ProposalEntity> existingOpt = proposalRepository.findByProjectId(id);
        ProposalEntity proposal;

        String ps = (String) payload.get("problemStatement");
        String sol = (String) payload.get("proposedSolution");
        String team = (String) payload.get("requiredTeam");
        String meth = (String) payload.get("methodology");
        String time = (String) payload.get("timeline");
        String budg = (String) payload.get("budget");
        String outc = (String) payload.get("expectedOutcomes");
        String imp = (String) payload.get("impactIndicators");
        String risks = (String) payload.get("risks");
        Boolean approved = payload.get("approved") != null ? Boolean.parseBoolean(payload.get("approved").toString()) : false;

        if (existingOpt.isPresent()) {
            proposal = existingOpt.get();
            if (ps != null) proposal.setProblemStatement(ps);
            if (sol != null) proposal.setProposedSolution(sol);
            if (team != null) proposal.setRequiredTeam(team);
            if (meth != null) proposal.setMethodology(meth);
            if (time != null) proposal.setTimeline(time);
            if (budg != null) proposal.setBudget(budg);
            if (outc != null) proposal.setExpectedOutcomes(outc);
            if (imp != null) proposal.setImpactIndicators(imp);
            if (risks != null) proposal.setRisks(risks);
            proposal.setApproved(approved);
            proposal.setIsAiDraft(false);
            proposal.setUpdatedAt(Instant.now());
        } else {
            proposal = ProposalEntity.builder()
                    .projectId(id)
                    .problemStatement(ps != null ? ps : "")
                    .proposedSolution(sol != null ? sol : "")
                    .requiredTeam(team != null ? team : "")
                    .methodology(meth != null ? meth : "")
                    .timeline(time != null ? time : "")
                    .budget(budg != null ? budg : "")
                    .expectedOutcomes(outc != null ? outc : "")
                    .impactIndicators(imp != null ? imp : "")
                    .risks(risks != null ? risks : "")
                    .isAiDraft(false)
                    .approved(approved)
                    .updatedAt(Instant.now())
                    .build();
        }

        ProposalEntity saved = proposalRepository.save(proposal);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/milestones")
    public ResponseEntity<?> addMilestone(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String dueDate = (String) payload.get("dueDate");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }

        MilestoneEntity m = MilestoneEntity.builder()
                .projectId(id)
                .title(title.trim())
                .dueDate(dueDate != null ? dueDate : "")
                .done(false)
                .build();

        MilestoneEntity saved = milestoneRepository.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/milestones/{mId}")
    public ResponseEntity<?> toggleMilestone(@PathVariable Long id, @PathVariable Long mId, @RequestBody Map<String, Object> payload) {
        Optional<MilestoneEntity> opt = milestoneRepository.findById(mId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Milestone not found"));
        }
        MilestoneEntity m = opt.get();
        boolean done = Boolean.parseBoolean(payload.get("done").toString());
        m.setDone(done);
        milestoneRepository.save(m);

        return ResponseEntity.ok(Map.of("success", true, "done", done));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> postMessage(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String body = (String) payload.get("body");
        String author = (String) payload.get("author");
        String role = (String) payload.get("role");

        if (body == null || body.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message body is required"));
        }

        MessageEntity msg = MessageEntity.builder()
                .projectId(id)
                .author(author != null && !author.isBlank() ? author : "Team Member")
                .role(role != null && !role.isBlank() ? role : "Team")
                .body(body.trim())
                .createdAt(Instant.now())
                .build();

        MessageEntity saved = messageRepository.save(msg);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/collaborations")
    public ResponseEntity<?> addCollaboration(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long industryPartnerId = Long.parseLong(payload.get("industryPartnerId").toString());
        String supportType = (String) payload.get("supportType");
        String note = (String) payload.get("note");

        CollaborationEntity c = CollaborationEntity.builder()
                .projectId(id)
                .industryPartnerId(industryPartnerId)
                .supportType(supportType != null ? supportType : "Funding")
                .note(note != null ? note : "")
                .status("active")
                .createdAt(Instant.now())
                .build();

        CollaborationEntity saved = collaborationRepository.save(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/impact")
    public ResponseEntity<?> recordImpact(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String indicator = (String) payload.get("indicator");
        String unit = (String) payload.get("unit");
        String kind = (String) payload.get("kind");
        String note = (String) payload.get("note");

        double beforeVal = 0.0;
        double afterVal = 0.0;
        try { beforeVal = Double.parseDouble(payload.get("beforeValue").toString()); } catch (Exception ignored) {}
        try { afterVal = Double.parseDouble(payload.get("afterValue").toString()); } catch (Exception ignored) {}

        ImpactRecordEntity imp = ImpactRecordEntity.builder()
                .projectId(id)
                .indicator(indicator != null ? indicator : "Metric")
                .unit(unit != null ? unit : "units")
                .kind(kind != null ? kind : "outcome")
                .beforeValue(beforeVal)
                .afterValue(afterVal)
                .note(note != null ? note : "")
                .measuredAt(Instant.now())
                .build();

        ImpactRecordEntity saved = impactRecordRepository.save(imp);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
