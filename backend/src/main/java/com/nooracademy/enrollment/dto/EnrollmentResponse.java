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
        Instant expiresAt,
        com.nooracademy.group.GroupStatus groupStatus,
        String teacherName,
        String roomName,
        java.time.LocalDate startDate,
        java.time.LocalDate endDate,
        java.util.List<com.nooracademy.session.dto.SessionResponse> sessions,
        java.math.BigDecimal coursePrice,
        Integer courseTotalSessions
) {
}
