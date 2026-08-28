package com.nooracademy.room.dto;

public record RoomResponse(
        Long id,
        String name,
        Integer maxCapacity
) {
}
