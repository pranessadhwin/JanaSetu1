package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.ChallengeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("portalChallengeRepository")
public interface PortalChallengeRepository extends JpaRepository<ChallengeEntity, Long> {
    List<ChallengeEntity> findByClusterId(Long clusterId);
    List<ChallengeEntity> findAllByOrderByCreatedAtDesc();
    List<ChallengeEntity> findByDistrictIgnoreCase(String district);
}
