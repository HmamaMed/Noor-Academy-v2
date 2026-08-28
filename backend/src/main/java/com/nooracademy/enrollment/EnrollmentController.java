package com.nooracademy.enrollment;

import com.nooracademy.enrollment.dto.EnrollmentRequest;
import com.nooracademy.enrollment.dto.EnrollmentResponse;
import com.nooracademy.security.CurrentUser;
import com.nooracademy.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public EnrollmentResponse apply(@CurrentUser User student, @Valid @RequestBody EnrollmentRequest request) {
        return enrollmentService.apply(student, request.groupId());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<EnrollmentResponse> mine(@CurrentUser User student) {
        return enrollmentService.findMine(student.getId());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public List<EnrollmentResponse> byGroup(@RequestParam Long groupId,
                                             @RequestParam(required = false) EnrollmentStatus status) {
        return enrollmentService.findByGroup(groupId, status);
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public EnrollmentResponse confirm(@PathVariable Long id) {
        return enrollmentService.confirm(id);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public EnrollmentResponse cancel(@PathVariable Long id, @CurrentUser User actor) {
        return enrollmentService.cancel(id, actor);
    }
}
