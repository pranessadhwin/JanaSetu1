package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "industry_partners")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryPartnerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String sector;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "focus_areas", columnDefinition = "json")
    @Builder.Default
    private List<String> focusAreas = new ArrayList<>();

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> offerings = new ArrayList<>();
}
