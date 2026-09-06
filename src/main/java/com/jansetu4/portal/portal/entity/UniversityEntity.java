package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "universities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniversityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> departments = new ArrayList<>();

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "expertise_tags", columnDefinition = "json")
    @Builder.Default
    private List<String> expertiseTags = new ArrayList<>();

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> labs = new ArrayList<>();

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "past_projects", columnDefinition = "json")
    @Builder.Default
    private List<String> pastProjects = new ArrayList<>();

    @Column(name = "patents_filed")
    @Builder.Default
    private Integer patentsFiled = 0;

    @Column(name = "startups_spun_off")
    @Builder.Default
    private Integer startupsSpunOff = 0;
}
