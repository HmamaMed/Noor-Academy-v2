package com.nooracademy.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select g from Group g where g.id = :id")
    java.util.Optional<Group> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    List<Group> findByRoomIdOrderById(Long roomId);

    List<Group> findByTeacherId(Long teacherId);
}
