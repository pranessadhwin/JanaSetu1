package com.jansetu4.portal.university.controller;

import com.jansetu4.portal.auth.entity.User;
import com.jansetu4.portal.common.ApiResponse;
import com.jansetu4.portal.university.dto.ProposeSolutionRequest;
import com.jansetu4.portal.university.dto.ReassignAssignmentRequest;
import com.jansetu4.portal.university.dto.UniversityAssignmentResponse;
import com.jansetu4.portal.university.dto.UniversityResponse;
import com.jansetu4.portal.university.service.UniversityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/legacy")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityService universityService;

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<UniversityResponse>>> getUniversities(
            @RequestParam(required = false) String discipline) {
        return ResponseEntity.ok(ApiResponse.success(
                "Universities fetched successfully",
                universityService.getUniversities(discipline)
        ));
    }

    @GetMapping("/university/challenges/claimable")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    public ResponseEntity<ApiResponse<List<UniversityAssignmentResponse>>> getClaimableChallenges(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                "Claimable challenges fetched successfully",
                universityService.getClaimableForUniversity(currentUser.getUniversityId())
        ));
    }

    @PostMapping("/university/assignments/{id}/claim")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    public ResponseEntity<ApiResponse<UniversityAssignmentResponse>> claimAssignment(
            @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                "Challenge claimed successfully",
                universityService.claimAssignment(id, currentUser.getUniversityId())
        ));
    }

    @PostMapping("/university/assignments/{id}/propose-solution")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    public ResponseEntity<ApiResponse<UniversityAssignmentResponse>> proposeSolution(
            @PathVariable Long id,
            @Valid @RequestBody ProposeSolutionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                "Solution proposed successfully",
                universityService.proposeSolution(id, currentUser.getUniversityId(), request)
        ));
    }

    @PostMapping("/university/assignments/{id}/accept")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    public ResponseEntity<ApiResponse<UniversityAssignmentResponse>> acceptAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Assignment accepted successfully",
                universityService.acceptAssignment(id)
        ));
    }

    @PostMapping("/university/assignments/{id}/reject")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    public ResponseEntity<ApiResponse<UniversityAssignmentResponse>> rejectAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Assignment rejected successfully",
                universityService.rejectAssignment(id)
        ));
    }

    @GetMapping("/university/{id}/assignments")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UniversityAssignmentResponse>>> getAssignments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Assignments fetched successfully",
                universityService.getAssignments(id)
        ));
    }

    @PostMapping("/university/assignments/{id}/reassign")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UniversityAssignmentResponse>> reassignAssignment(
            @PathVariable Long id,
            @Valid @RequestBody ReassignAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Assignment reassigned successfully",
                universityService.reassignAssignment(id, request)
        ));
    }
}

