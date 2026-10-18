package com.nooracademy.group;

import com.nooracademy.common.exception.ConflictException;
import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.course.Course;
import com.nooracademy.course.CourseRepository;
import com.nooracademy.enrollment.EnrollmentRepository;
import com.nooracademy.enrollment.EnrollmentStatus;
import com.nooracademy.group.dto.GroupRequest;
import com.nooracademy.group.dto.GroupResponse;
import com.nooracademy.group.dto.GroupStatusUpdateRequest;
import com.nooracademy.room.Room;
import com.nooracademy.room.RoomRepository;
import com.nooracademy.session.Session;
import com.nooracademy.session.SessionRepository;
import com.nooracademy.session.dto.SessionRequest;
import com.nooracademy.session.dto.SessionResponse;
import com.nooracademy.user.Role;
import com.nooracademy.user.User;
import com.nooracademy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final jakarta.persistence.EntityManager entityManager;

    public List<GroupResponse> findAll() {
        return groupRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<GroupResponse> findPublic() {
        return groupRepository.findAll().stream().filter(this::isPublic).map(this::toResponse).toList();
    }

    private boolean isPublic(Group group) {
        return (group.getStatus() == GroupStatus.ACTIVE || group.getStatus() == GroupStatus.FULL)
                && !group.getEndDate().isBefore(java.time.LocalDate.now());
    }

    public GroupResponse findVisible(Long id, User actor) {
        Group group = getGroupOrThrow(id);
        if (isPublic(group) || (actor != null && (actor.getRole().isAdmin()
            || (actor.getRole() == Role.TEACHER && group.getTeacher().getId().equals(actor.getId()))
            || enrollmentRepository.existsByStudentIdAndGroupIdAndStatus(actor.getId(), id, EnrollmentStatus.CONFIRMED)))) return toResponse(group);
        throw new NotFoundException("Group not found");
    }

    public List<GroupResponse> findByTeacher(Long teacherId) {
        return groupRepository.findByTeacherId(teacherId).stream().map(this::toResponse).toList();
    }

    public GroupResponse findById(Long id) {
        return toResponse(getGroupOrThrow(id));
    }

    @Transactional
    public GroupResponse create(GroupRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new NotFoundException("Course not found: " + request.courseId()));
        Room room = roomRepository.findLockedById(request.roomId())
                .orElseThrow(() -> new NotFoundException("Room not found: " + request.roomId()));

        User teacher = userRepository.findLockedById(request.teacherId())
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> new NotFoundException("Teacher not found: " + request.teacherId()));
        validateSchedule(room.getId(), teacher.getId(), request.startDate(), request.endDate(), request.sessions(), null);

        Group group = Group.builder()
                .course(course)
                .teacher(teacher)
                .room(room)
                .groupName(request.groupName())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(GroupStatus.DRAFT)
                .build();

        request.sessions().forEach(s -> group.getSessions().add(toSessionEntity(s, group)));

        return toResponse(groupRepository.save(group));
    }

    @Transactional
    public GroupResponse update(Long id, GroupRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new NotFoundException("Course not found: " + request.courseId()));
        Room room = roomRepository.findLockedById(request.roomId())
                .orElseThrow(() -> new NotFoundException("Room not found: " + request.roomId()));

        User teacher = userRepository.findLockedById(request.teacherId())
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> new NotFoundException("Teacher not found: " + request.teacherId()));
        Group group = groupRepository.findLockedById(id).orElseThrow(() -> new NotFoundException("Group not found"));
        validateSchedule(room.getId(), teacher.getId(), request.startDate(), request.endDate(), request.sessions(), group.getId());
        if (enrollmentRepository.countByGroupIdAndStatus(id, EnrollmentStatus.CONFIRMED) > room.getMaxCapacity()) {
            throw new ConflictException("The room is too small for the enrolled students");
        }

        group.setCourse(course);
        group.setTeacher(teacher);
        group.setRoom(room);
        group.setGroupName(request.groupName());
        group.setStartDate(request.startDate());
        group.setEndDate(request.endDate());

        group.getSessions().clear();
        request.sessions().forEach(s -> group.getSessions().add(toSessionEntity(s, group)));

        return toResponse(group);
    }

    @Transactional
    public GroupResponse updateStatus(Long id, GroupStatusUpdateRequest request) {
        Group snapshot = getGroupOrThrow(id);
        roomRepository.findLockedById(snapshot.getRoom().getId()).orElseThrow();
        userRepository.findLockedById(snapshot.getTeacher().getId()).orElseThrow();
        Long lockedRoomId = snapshot.getRoom().getId(), lockedTeacherId = snapshot.getTeacher().getId();
        Group group = groupRepository.findLockedById(id).orElseThrow();
        entityManager.refresh(group);
        if (!lockedRoomId.equals(group.getRoom().getId()) || !lockedTeacherId.equals(group.getTeacher().getId())) {
            throw new ConflictException("Group assignments changed. Reload and try again.");
        }
        if (request.status() == GroupStatus.DRAFT || request.status() == GroupStatus.ACTIVE || request.status() == GroupStatus.FULL) {
            validateSchedule(group.getRoom().getId(), group.getTeacher().getId(), group.getStartDate(), group.getEndDate(),
                    group.getSessions().stream().map(s -> new SessionRequest(s.getDayOfWeek(), s.getStartTime(), s.getEndTime())).toList(), id);
        }
        group.setStatus(request.status());
        return toResponse(group);
    }

    @Transactional
    public void delete(Long id) {
        if (!groupRepository.existsById(id)) {
            throw new NotFoundException("Group not found: " + id);
        }
        groupRepository.deleteById(id);
    }

    /**
     * Enforces the room double-booking rule: a Room cannot host two sessions of different
     * Groups on the same day of week with overlapping time blocks.
     */
    private void validateSchedule(Long roomId, Long teacherId, java.time.LocalDate startDate,
            java.time.LocalDate endDate, List<SessionRequest> sessions, Long excludeGroupId) {
        if (endDate.isBefore(startDate)) throw new com.nooracademy.common.exception.BadRequestException("End date must be on or after start date");
        for (int i = 0; i < sessions.size(); i++) {
            SessionRequest slot = sessions.get(i);
            if (!slot.endTime().isAfter(slot.startTime())) throw new com.nooracademy.common.exception.BadRequestException("Session end time must be after start time");
            for (int j = 0; j < i; j++) {
                SessionRequest previous = sessions.get(j);
                if (slot.dayOfWeek() == previous.dayOfWeek() && slot.startTime().isBefore(previous.endTime()) && slot.endTime().isAfter(previous.startTime())) {
                    throw new ConflictException("The group's sessions overlap");
                }
            }
            if (!sessionRepository.findConflicts(roomId, teacherId, startDate, endDate,
                    slot.dayOfWeek(), slot.startTime(), slot.endTime(), excludeGroupId).isEmpty()) {
                throw new ConflictException("Room or teacher is already booked on " + slot.dayOfWeek() + " during this time and date range");
            }
        }
    }

    private Session toSessionEntity(SessionRequest request, Group group) {
        return Session.builder()
                .group(group)
                .dayOfWeek(request.dayOfWeek())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .build();
    }

    Group getGroupOrThrow(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Group not found: " + id));
    }

    private GroupResponse toResponse(Group group) {
        int confirmedSeats = enrollmentRepository.countByGroupIdAndStatus(group.getId(), EnrollmentStatus.CONFIRMED);
        List<SessionResponse> sessions = group.getSessions().stream()
                .map(s -> new SessionResponse(s.getId(), s.getDayOfWeek(), s.getStartTime(), s.getEndTime()))
                .toList();
        return new GroupResponse(
                group.getId(),
                group.getCourse().getId(),
                group.getCourse().getTitle(),
                group.getTeacher().getId(),
                group.getTeacher().getFirstName() + " " + group.getTeacher().getLastName(),
                group.getRoom().getId(),
                group.getRoom().getName(),
                group.getRoom().getMaxCapacity(),
                group.getGroupName(),
                group.getStartDate(),
                group.getEndDate(),
                group.getStatus(),
                sessions,
                confirmedSeats,
                Math.max(0, group.getRoom().getMaxCapacity() - confirmedSeats)
        );
    }
}
