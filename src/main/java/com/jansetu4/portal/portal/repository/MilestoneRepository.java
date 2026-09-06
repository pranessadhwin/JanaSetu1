package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.MilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<MilestoneEntity, Long> {
    List<MilestoneEntity> findByProjectId(Long projectId);
}
