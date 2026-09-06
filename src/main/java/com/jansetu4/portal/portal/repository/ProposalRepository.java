package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.ProposalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<ProposalEntity, Long> {
    Optional<ProposalEntity> findByProjectId(Long projectId);
}
