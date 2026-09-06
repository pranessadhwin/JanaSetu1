package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("portalProjectRepository")
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    Optional<ProjectEntity> findByChallengeId(Long challengeId);
    List<ProjectEntity> findByUniversityId(Long universityId);
    List<ProjectEntity> findAllByOrderByUpdatedAtDesc();
}
