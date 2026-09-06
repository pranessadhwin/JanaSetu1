package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.ImpactRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImpactRecordRepository extends JpaRepository<ImpactRecordEntity, Long> {
    List<ImpactRecordEntity> findByProjectId(Long projectId);
}
