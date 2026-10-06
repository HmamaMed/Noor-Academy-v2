package com.nooracademy.room;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Room e where e.id = :id")
    java.util.Optional<Room> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

}
