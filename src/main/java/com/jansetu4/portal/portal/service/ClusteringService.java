package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.ChallengeClusterEntity;
import com.jansetu4.portal.portal.repository.ChallengeClusterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClusteringService {

    private final ChallengeClusterRepository clusterRepository;

    public ChallengeClusterEntity findOrCreateCluster(String category, String subTag, String district) {
        Optional<ChallengeClusterEntity> existing = clusterRepository.findByCategoryAndSubTagAndDistrict(category, subTag, district);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Check if there is any cluster in the same district and category
        List<ChallengeClusterEntity> all = clusterRepository.findAll();
        for (ChallengeClusterEntity c : all) {
            if (c.getDistrict().equalsIgnoreCase(district) && c.getCategory().equalsIgnoreCase(category) && c.getSubTag().equalsIgnoreCase(subTag)) {
                return c;
            }
        }

        ChallengeClusterEntity newCluster = ChallengeClusterEntity.builder()
                .title(subTag + " — " + district)
                .category(category)
                .subTag(subTag)
                .district(district)
                .build();

        return clusterRepository.save(newCluster);
    }
}
