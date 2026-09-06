package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonObjectListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "projects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "cluster_id")
    private Long clusterId;

    @Column(name = "university_id", nullable = false)
    private Long universityId;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 50)
    @Builder.Default
    private String stage = "assigned";

    @Convert(converter = JsonObjectListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<Map<String, Object>> team = new ArrayList<>();

    @Column(name = "impact_level", length = 50)
    @Builder.Default
    private String impactLevel = "Medium";

    @Column(name = "feasibility_level", length = 50)
    @Builder.Default
    private String feasibilityLevel = "Medium";

    @Column(name = "cost_lakh")
    @Builder.Default
    private Integer costLakh = 0;

    @Column(name = "novelty_level", length = 50)
    @Builder.Default
    private String noveltyLevel = "Medium";

    @Column(name = "scalability_level", length = 50)
    @Builder.Default
    private String scalabilityLevel = "Medium";

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
