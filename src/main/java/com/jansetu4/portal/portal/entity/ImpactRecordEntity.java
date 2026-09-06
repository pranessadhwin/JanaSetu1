package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "impact_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private String indicator;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(length = 50)
    @Builder.Default
    private String kind = "outcome";

    @Column(name = "before_value")
    @Builder.Default
    private Double beforeValue = 0.0;

    @Column(name = "after_value")
    @Builder.Default
    private Double afterValue = 0.0;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String note = "";

    @Column(name = "measured_at")
    @Builder.Default
    private Instant measuredAt = Instant.now();
}
