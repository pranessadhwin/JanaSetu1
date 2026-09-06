package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.CollaborationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollaborationRepository extends JpaRepository<CollaborationEntity, Long> {
    List<CollaborationEntity> findByProjectId(Long projectId);
    List<CollaborationEntity> findByIndustryPartnerId(Long industryPartnerId);
}
