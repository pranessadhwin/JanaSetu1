package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/universities")
@RequiredArgsConstructor
public class PortalUniversityController {

    private final PortalUniversityRepository universityRepository;
    private final PersonRepository personRepository;
    private final ProjectRepository projectRepository;
    private final PortalChallengeRepository challengeRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUniversities() {
        List<UniversityEntity> unis = universityRepository.findAll();
        List<PersonEntity> allPeople = personRepository.findAll();
        List<ProjectEntity> allProjects = projectRepository.findAll();

        List<Map<String, Object>> result = unis.stream().map(u -> {
            List<PersonEntity> uniPeople = allPeople.stream().filter(p -> p.getUniversityId().equals(u.getId())).toList();
            List<ProjectEntity> uniProjects = allProjects.stream().filter(p -> p.getUniversityId().equals(u.getId())).toList();

            long facultyCount = uniPeople.stream().filter(p -> "faculty".equalsIgnoreCase(p.getRole())).count();
            long studentCount = uniPeople.stream().filter(p -> "student".equalsIgnoreCase(p.getRole())).count();

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("shortName", u.getShortName());
            map.put("district", u.getDistrict());
            map.put("description", u.getDescription());
            map.put("departments", u.getDepartments());
            map.put("expertiseTags", u.getExpertiseTags());
            map.put("labs", u.getLabs());
            map.put("pastProjects", u.getPastProjects());
            map.put("patentsFiled", u.getPatentsFiled());
            map.put("startupsSpunOff", u.getStartupsSpunOff());
            map.put("facultyCount", facultyCount);
            map.put("studentCount", studentCount);
            map.put("activeProjectsCount", uniProjects.size());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUniversityById(@PathVariable Long id) {
        Optional<UniversityEntity> opt = universityRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "University not found"));
        }
        UniversityEntity uni = opt.get();

        List<PersonEntity> people = personRepository.findByUniversityId(id);
        List<ProjectEntity> projects = projectRepository.findByUniversityId(id);
        Map<Long, ChallengeEntity> challengeMap = challengeRepository.findAll().stream()
                .collect(Collectors.toMap(ChallengeEntity::getId, c -> c, (a, b) -> a));

        List<Map<String, Object>> enrichedProjects = projects.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("challengeId", p.getChallengeId());
            map.put("universityId", p.getUniversityId());
            map.put("category", p.getCategory());
            map.put("stage", p.getStage());
            map.put("team", p.getTeam());
            map.put("costLakh", p.getCostLakh());
            map.put("challenge", challengeMap.get(p.getChallengeId()));
            return map;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("university", uni);
        result.put("people", people);
        result.put("projects", enrichedProjects);

        return ResponseEntity.ok(result);
    }
}
