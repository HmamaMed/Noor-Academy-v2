package com.nooracademy.course.dto;

import java.math.BigDecimal;

public record CourseResponse(
        Long id,
        String title,
        String description,
        String syllabus,
        String imageUrl,
        BigDecimal price,
        Integer totalSessions
) {
}
