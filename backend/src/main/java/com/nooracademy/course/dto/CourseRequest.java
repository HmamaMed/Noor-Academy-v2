package com.nooracademy.course.dto;

import jakarta.validation.constraints.NotBlank;

public record CourseRequest(
        @NotBlank String title,
        String description,
        String syllabus
) {
}
