package com.nooracademy.group.dto;

import com.nooracademy.group.GroupStatus;
import jakarta.validation.constraints.NotNull;

public record GroupStatusUpdateRequest(
        @NotNull GroupStatus status
) {
}
