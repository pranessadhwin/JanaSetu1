package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.KnowledgeItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeItemEntity, Long> {
    List<KnowledgeItemEntity> findByCategory(String category);
}
