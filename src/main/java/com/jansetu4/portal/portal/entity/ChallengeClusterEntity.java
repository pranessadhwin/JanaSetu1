package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "challenge_clusters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeClusterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "sub_tag", nullable = false, length = 100)
    private String subTag;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
