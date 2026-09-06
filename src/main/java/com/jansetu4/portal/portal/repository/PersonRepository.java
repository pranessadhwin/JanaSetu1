package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.PersonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<PersonEntity, Long> {
    List<PersonEntity> findByUniversityId(Long universityId);
}
