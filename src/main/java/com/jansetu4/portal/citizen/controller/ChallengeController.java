package com.jansetu4.portal.citizen.controller;

import com.jansetu4.portal.auth.entity.User;
import com.jansetu4.portal.citizen.dto.ChallengeResponse;
import com.jansetu4.portal.citizen.dto.CreateChallengeRequest;
import com.jansetu4.portal.citizen.service.ChallengeService;
import com.jansetu4.portal.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/legacy/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(@Valid @ModelAttribute CreateChallengeRequest request,
                                                                          @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Challenge submitted successfully", challengeService.createChallenge(request, currentUser)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getMyChallenges(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Challenges fetched successfully", challengeService.getMyChallenges(currentUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getChallenge(@PathVariable Long id,
                                                                       @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Challenge fetched successfully", challengeService.getChallengeDetail(id, currentUser)));
    }
}
