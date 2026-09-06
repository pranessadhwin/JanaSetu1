package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.UniversityResponseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UniversityResponseRepository extends JpaRepository<UniversityResponseEntity, Long> {
    List<UniversityResponseEntity> findByChallengeId(Long challengeId);
    Optional<UniversityResponseEntity> findByChallengeIdAndUniversityId(Long challengeId, Long universityId);
}
