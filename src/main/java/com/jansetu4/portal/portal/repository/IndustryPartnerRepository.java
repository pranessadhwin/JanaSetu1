package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.IndustryPartnerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("portalIndustryPartnerRepository")
public interface IndustryPartnerRepository extends JpaRepository<IndustryPartnerEntity, Long> {
}
