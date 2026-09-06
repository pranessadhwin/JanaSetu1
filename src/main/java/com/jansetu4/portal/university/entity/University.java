package com.jansetu4.portal.university.entity;

import com.jansetu4.portal.common.BaseEntity;
import com.jansetu4.portal.common.enums.Domain;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "legacy_universities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class University extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String location;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER, targetClass = Domain.class)
    @CollectionTable(name = "university_disciplines", joinColumns = @JoinColumn(name = "university_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", nullable = false)
    private List<Domain> disciplines = new ArrayList<>();

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;
}
