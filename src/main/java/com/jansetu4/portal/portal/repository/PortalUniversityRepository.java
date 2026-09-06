package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.UniversityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("portalUniversityRepository")
public interface PortalUniversityRepository extends JpaRepository<UniversityEntity, Long> {
}
