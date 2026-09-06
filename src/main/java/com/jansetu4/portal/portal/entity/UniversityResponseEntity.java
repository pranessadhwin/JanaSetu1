package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "university_responses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniversityResponseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "university_id", nullable = false)
    private Long universityId;

    @Column(length = 50)
    @Builder.Default
    private String status = "shortlisted";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String note = "";

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "match_reasons", columnDefinition = "json")
    @Builder.Default
    private List<String> matchReasons = new ArrayList<>();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
