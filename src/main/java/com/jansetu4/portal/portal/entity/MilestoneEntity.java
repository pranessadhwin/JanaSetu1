package com.jansetu4.portal.portal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "milestones")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private String title;

    @Column(name = "due_date", length = 50)
    @Builder.Default
    private String dueDate = "";

    @Builder.Default
    private Boolean done = false;
}
