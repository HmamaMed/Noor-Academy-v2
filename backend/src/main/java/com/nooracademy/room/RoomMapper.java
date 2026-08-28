package com.nooracademy.room;

import com.nooracademy.room.dto.RoomResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    RoomResponse toResponse(Room room);
}
