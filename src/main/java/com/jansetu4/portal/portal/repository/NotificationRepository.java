package com.jansetu4.portal.portal.repository;

import com.jansetu4.portal.portal.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("portalNotificationRepository")
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByChallengeIdOrderByCreatedAtDesc(Long challengeId);
}
