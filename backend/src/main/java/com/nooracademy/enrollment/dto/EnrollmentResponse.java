package com.nooracademy.enrollment.dto;

import com.nooracademy.enrollment.EnrollmentStatus;

import java.time.Instant;

public record EnrollmentResponse(
        Long id,
        Long groupId,
        String groupName,
        String courseTitle,
        Long studentId,
        String studentName,
        EnrollmentStatus status,
        Instant appliedAt,
        Instant confirmedAt,
        Instant expiresAt
) {
}
