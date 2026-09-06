package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.ChallengeClusterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChallengeClusterRepository extends JpaRepository<ChallengeClusterEntity, Long> {
    Optional<ChallengeClusterEntity> findByCategoryAndSubTagAndDistrict(String category, String subTag, String district);
}
