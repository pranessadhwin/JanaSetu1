package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "people")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "university_id", nullable = false)
    private Long universityId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String role;

    @Column(nullable = false)
    private String department;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private Boolean available = true;
}
