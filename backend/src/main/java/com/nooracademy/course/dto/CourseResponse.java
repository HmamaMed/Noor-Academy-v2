package com.nooracademy.course.dto;

public record CourseResponse(
        Long id,
        String title,
        String description,
        String syllabus
) {
}
