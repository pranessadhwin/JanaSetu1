package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.KnowledgeItemEntity;
import com.jansetu4.portal.portal.repository.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class PortalKnowledgeController {

    private final KnowledgeBaseRepository knowledgeBaseRepository;

    @GetMapping
    public ResponseEntity<List<KnowledgeItemEntity>> getKnowledgeItems(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type
    ) {
        List<KnowledgeItemEntity> items = knowledgeBaseRepository.findAll();

        if (category != null && !category.isBlank()) {
            items = items.stream().filter(k -> k.getCategory().equalsIgnoreCase(category.trim())).toList();
        }
        if (type != null && !type.isBlank()) {
            items = items.stream().filter(k -> k.getType().equalsIgnoreCase(type.trim())).toList();
        }
        if (q != null && !q.isBlank()) {
            String search = q.trim().toLowerCase();
            items = items.stream().filter(k ->
                    (k.getTitle() != null && k.getTitle().toLowerCase().contains(search)) ||
                    (k.getSummary() != null && k.getSummary().toLowerCase().contains(search)) ||
                    (k.getTags() != null && k.getTags().stream().anyMatch(t -> t.toLowerCase().contains(search)))
            ).toList();
        }

        return ResponseEntity.ok(items);
    }
}
