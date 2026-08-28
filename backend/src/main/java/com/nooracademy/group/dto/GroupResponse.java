package com.nooracademy.group.dto;

import com.nooracademy.group.GroupStatus;
import com.nooracademy.session.dto.SessionResponse;

import java.time.LocalDate;
import java.util.List;

public record GroupResponse(
        Long id,
        Long courseId,
        String courseTitle,
        Long teacherId,
        String teacherName,
        Long roomId,
        String roomName,
        Integer roomCapacity,
        String groupName,
        LocalDate startDate,
        LocalDate endDate,
        GroupStatus status,
        List<SessionResponse> sessions,
        int confirmedSeats,
        int remainingSeats
) {
}
