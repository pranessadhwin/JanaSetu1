package com.jansetu4.portal.portal.entity;

import com.jansetu4.portal.portal.entity.converter.JsonStringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "knowledge_base")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(nullable = false, length = 100)
    private String category;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(length = 255)
    @Builder.Default
    private String source = "";

    @Column(name = "cost_lakh")
    private Integer costLakh;
}
