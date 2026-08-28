package com.nooracademy.room;

import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.room.dto.RoomRequest;
import com.nooracademy.room.dto.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;

    public List<RoomResponse> findAll() {
        return roomRepository.findAll().stream().map(roomMapper::toResponse).toList();
    }

    public RoomResponse findById(Long id) {
        return roomMapper.toResponse(getRoomOrThrow(id));
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        Room room = Room.builder().name(request.name()).maxCapacity(request.maxCapacity()).build();
        return roomMapper.toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = getRoomOrThrow(id);
        room.setName(request.name());
        room.setMaxCapacity(request.maxCapacity());
        return roomMapper.toResponse(room);
    }

    @Transactional
    public void delete(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new NotFoundException("Room not found: " + id);
        }
        roomRepository.deleteById(id);
    }

    Room getRoomOrThrow(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Room not found: " + id));
    }
}
