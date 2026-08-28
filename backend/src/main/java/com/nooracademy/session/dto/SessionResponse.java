package com.nooracademy.session.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record SessionResponse(
        Long id,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {
}
