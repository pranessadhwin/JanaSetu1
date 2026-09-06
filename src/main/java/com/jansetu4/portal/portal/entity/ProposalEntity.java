package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "proposals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "problem_statement", columnDefinition = "TEXT")
    @Builder.Default
    private String problemStatement = "";

    @Column(name = "proposed_solution", columnDefinition = "TEXT")
    @Builder.Default
    private String proposedSolution = "";

    @Column(name = "required_team", columnDefinition = "TEXT")
    @Builder.Default
    private String requiredTeam = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String methodology = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String timeline = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String budget = "";

    @Column(name = "expected_outcomes", columnDefinition = "TEXT")
    @Builder.Default
    private String expectedOutcomes = "";

    @Column(name = "impact_indicators", columnDefinition = "TEXT")
    @Builder.Default
    private String impactIndicators = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String risks = "";

    @Column(name = "is_ai_draft")
    @Builder.Default
    private Boolean isAiDraft = true;

    @Builder.Default
    private Boolean approved = false;

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
