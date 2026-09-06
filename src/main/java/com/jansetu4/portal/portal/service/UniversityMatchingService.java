package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.PersonEntity;
import com.jansetu4.portal.portal.entity.UniversityEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UniversityMatchingService {

    private final DistrictService districtService;

    @Getter
    @AllArgsConstructor
    public static class UniversityMatch {
        private UniversityEntity university;
        private int score;
        private List<String> reasons;
    }

    public List<UniversityMatch> matchUniversities(String category, List<String> subTags, String district,
                                                  List<UniversityEntity> universities, List<PersonEntity> people, int limit) {
        List<UniversityMatch> results = new ArrayList<>();

        for (UniversityEntity uni : universities) {
            int score = 0;
            List<String> reasons = new ArrayList<>();

            // 1. Geographic proximity
            double dist = districtService.districtDistanceKm(district, uni.getDistrict());
            if (dist < 30) {
                score += 35;
                reasons.add("Same district (" + uni.getDistrict() + ")");
            } else if (dist < 100) {
                score += 25;
                reasons.add("Adjacent district (" + Math.round(dist) + " km away in " + uni.getDistrict() + ")");
            } else {
                score += Math.max(5, (int) (20 - dist / 25));
                reasons.add(Math.round(dist) + " km away (" + uni.getDistrict() + ")");
            }

            // 2. Department & expertise match
            List<String> matchedTags = new ArrayList<>();
            if (uni.getExpertiseTags() != null) {
                for (String tag : uni.getExpertiseTags()) {
                    for (String st : subTags) {
                        if (tag.toLowerCase().contains(st.toLowerCase()) || st.toLowerCase().contains(tag.toLowerCase())) {
                            matchedTags.add(tag);
                        }
                    }
                }
            }

            if (!matchedTags.isEmpty()) {
                score += Math.min(30, matchedTags.size() * 15);
                reasons.add("Matching department expertise: " + String.join(", ", matchedTags.stream().distinct().limit(2).toList()));
            }

            // 3. Faculty skill match
            List<PersonEntity> uniPeople = people.stream()
                    .filter(p -> p.getUniversityId().equals(uni.getId()))
                    .toList();

            List<String> facultyMatches = new ArrayList<>();
            for (PersonEntity p : uniPeople) {
                if (p.getSkills() != null) {
                    for (String sk : p.getSkills()) {
                        for (String st : subTags) {
                            if (sk.toLowerCase().contains(st.toLowerCase()) || st.toLowerCase().contains(sk.toLowerCase())) {
                                facultyMatches.add(p.getName());
                            }
                        }
                    }
                }
            }

            if (!facultyMatches.isEmpty()) {
                score += Math.min(25, facultyMatches.size() * 10);
                reasons.add("Domain faculty available: " + String.join(", ", facultyMatches.stream().distinct().limit(2).toList()));
            }

            // 4. Lab capacity
            if (uni.getLabs() != null && !uni.getLabs().isEmpty()) {
                score += 10;
                reasons.add("Equipped laboratories (" + uni.getLabs().get(0) + ")");
            }

            results.add(new UniversityMatch(uni, score, reasons));
        }

        return results.stream()
                .sorted((a, b) -> Integer.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
