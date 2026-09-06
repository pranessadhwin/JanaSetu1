package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "stage_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(nullable = false, length = 50)
    private String stage;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String note = "";

    @Column(name = "responsible_party", length = 100)
    @Builder.Default
    private String responsibleParty = "Platform";

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
