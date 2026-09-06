package com.jansetu4.portal.portal.controller;

import com.jansetu4.portal.portal.entity.KnowledgeItemEntity;
import com.jansetu4.portal.portal.repository.KnowledgeBaseRepository;
import com.jansetu4.portal.portal.service.MentorCopilotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
public class PortalMentorController {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final MentorCopilotService mentorCopilotService;

    @PostMapping("/chat")
    public ResponseEntity<?> chatWithMentor(@RequestBody Map<String, Object> payload) {
        String question = payload.get("question") != null ? (String) payload.get("question") : (String) payload.get("message");
        String context = (String) payload.get("context");

        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is required."));
        }

        List<KnowledgeItemEntity> kb = knowledgeBaseRepository.findAll();
        MentorCopilotService.MentorResponse res = mentorCopilotService.answerQuestion(question, kb, context);

        List<Map<String, Object>> sources = (res.getSources() != null ? res.getSources() : Collections.<KnowledgeItemEntity>emptyList())
                .stream().map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getId());
                    map.put("title", s.getTitle());
                    map.put("type", s.getType());
                    map.put("source", s.getSource());
                    return map;
                }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("answer", res.getAnswer());
        response.put("sources", sources);

        return ResponseEntity.ok(response);
    }
}
