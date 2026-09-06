package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "collaborations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaborationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "industry_partner_id", nullable = false)
    private Long industryPartnerId;

    @Column(name = "support_type", nullable = false, length = 100)
    private String supportType;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String note = "";

    @Column(length = 50)
    @Builder.Default
    private String status = "interested";

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
