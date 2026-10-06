package com.nooracademy.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session, Long> {

    /**
     * Sessions in the same room, on the same day, whose time block overlaps the given
     * window — used to prevent double-booking a room when creating/editing a Group.
     */
    @Query("""
            select s from Session s
            where (s.group.room.id = :roomId or s.group.teacher.id = :teacherId)
              and s.group.status in (com.nooracademy.group.GroupStatus.DRAFT,
                  com.nooracademy.group.GroupStatus.ACTIVE, com.nooracademy.group.GroupStatus.FULL)
              and s.group.startDate <= :endDate and s.group.endDate >= :startDate
              and s.dayOfWeek = :dayOfWeek
              and (:excludeGroupId is null or s.group.id <> :excludeGroupId)
              and s.startTime < :endTime and s.endTime > :startTime
            """)
    List<Session> findConflicts(@Param("roomId") Long roomId, @Param("teacherId") Long teacherId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate,
            @Param("dayOfWeek") DayOfWeek dayOfWeek, @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime, @Param("excludeGroupId") Long excludeGroupId);
}
