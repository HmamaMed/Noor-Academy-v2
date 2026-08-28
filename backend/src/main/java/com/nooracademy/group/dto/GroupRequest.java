package com.nooracademy.group.dto;

import com.nooracademy.session.dto.SessionRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record GroupRequest(
        @NotNull Long courseId,
        @NotNull Long teacherId,
        @NotNull Long roomId,
        @NotBlank String groupName,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotEmpty @Valid List<SessionRequest> sessions
) {
}
