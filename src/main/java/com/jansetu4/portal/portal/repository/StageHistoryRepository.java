package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.StageHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StageHistoryRepository extends JpaRepository<StageHistoryEntity, Long> {
    List<StageHistoryEntity> findByChallengeIdOrderByCreatedAtDesc(Long challengeId);
    List<StageHistoryEntity> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
