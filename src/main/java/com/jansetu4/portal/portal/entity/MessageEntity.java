package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(length = 50)
    @Builder.Default
    private String role = "Team";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
