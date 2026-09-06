package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/industry")
@RequiredArgsConstructor
public class PortalIndustryController {

    private final IndustryPartnerRepository industryPartnerRepository;
    private final CollaborationRepository collaborationRepository;
    private final ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getIndustryPartners() {
        List<IndustryPartnerEntity> partners = industryPartnerRepository.findAll();
        List<CollaborationEntity> collabs = collaborationRepository.findAll();
        Map<Long, ProjectEntity> projectMap = projectRepository.findAll().stream()
                .collect(Collectors.toMap(ProjectEntity::getId, p -> p, (a, b) -> a));

        List<Map<String, Object>> result = partners.stream().map(partner -> {
            List<Map<String, Object>> partnerCollabs = collabs.stream()
                    .filter(c -> c.getIndustryPartnerId().equals(partner.getId()))
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", c.getId());
                        map.put("projectId", c.getProjectId());
                        map.put("supportType", c.getSupportType());
                        map.put("note", c.getNote());
                        map.put("status", c.getStatus());
                        map.put("createdAt", c.getCreatedAt());
                        map.put("project", projectMap.get(c.getProjectId()));
                        return map;
                    }).toList();

            Map<String, Object> map = new HashMap<>();
            map.put("id", partner.getId());
            map.put("name", partner.getName());
            map.put("sector", partner.getSector());
            map.put("district", partner.getDistrict());
            map.put("description", partner.getDescription());
            map.put("focusAreas", partner.getFocusAreas());
            map.put("offerings", partner.getOfferings());
            map.put("collaborations", partnerCollabs);
            map.put("totalSupportedProjects", partnerCollabs.size());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
