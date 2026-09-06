package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "challenges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, length = 100)
    private String category;

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "sub_tags", columnDefinition = "json")
    @Builder.Default
    private List<String> subTags = new ArrayList<>();

    @Column(nullable = false, length = 100)
    private String district;

    @Column(length = 100)
    @Builder.Default
    private String block = "";

    @Column(length = 100)
    @Builder.Default
    private String village = "";

    private Double lat;
    private Double lng;

    @Column(name = "affected_population")
    @Builder.Default
    private Integer affectedPopulation = 0;

    @Column(name = "has_alternative")
    @Builder.Default
    private Boolean hasAlternative = true;

    @Column(length = 50)
    @Builder.Default
    private String frequency = "occasional";

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "vulnerable_groups", columnDefinition = "json")
    @Builder.Default
    private List<String> vulnerableGroups = new ArrayList<>();

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "urgency_keywords", columnDefinition = "json")
    @Builder.Default
    private List<String> urgencyKeywords = new ArrayList<>();

    @Column(length = 50)
    @Builder.Default
    private String priority = "Low";

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "priority_reasons", columnDefinition = "json")
    @Builder.Default
    private List<String> priorityReasons = new ArrayList<>();

    @Column(length = 50)
    @Builder.Default
    private String status = "submitted";

    @Column(name = "cluster_id")
    private Long clusterId;

    @Column(name = "reporter_name", length = 150)
    @Builder.Default
    private String reporterName = "Anonymous";

    @Column(name = "reporter_type", length = 100)
    @Builder.Default
    private String reporterType = "Citizen";

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "attachments", columnDefinition = "json")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
