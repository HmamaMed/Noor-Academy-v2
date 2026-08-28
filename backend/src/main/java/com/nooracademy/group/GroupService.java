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
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<GroupResponse> findAll() {
        return groupRepository.findAll().stream().map(this::toResponse).toList();
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
        User teacher = userRepository.findById(request.teacherId())
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> new NotFoundException("Teacher not found: " + request.teacherId()));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new NotFoundException("Room not found: " + request.roomId()));

        validateNoRoomConflict(room.getId(), request.sessions(), null);

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
        Group group = getGroupOrThrow(id);
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new NotFoundException("Course not found: " + request.courseId()));
        User teacher = userRepository.findById(request.teacherId())
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> new NotFoundException("Teacher not found: " + request.teacherId()));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new NotFoundException("Room not found: " + request.roomId()));

        validateNoRoomConflict(room.getId(), request.sessions(), group.getId());

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
        Group group = getGroupOrThrow(id);
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
    private void validateNoRoomConflict(Long roomId, List<SessionRequest> requestedSessions, Long excludeGroupId) {
        for (SessionRequest s : requestedSessions) {
            List<Session> overlapping = sessionRepository.findOverlapping(
                    roomId, s.dayOfWeek(), s.startTime(), s.endTime(), excludeGroupId);
            if (!overlapping.isEmpty()) {
                Session conflict = overlapping.get(0);
                throw new ConflictException(
                        "Room is already booked on %s from %s to %s (group: %s)".formatted(
                                s.dayOfWeek(), conflict.getStartTime(), conflict.getEndTime(),
                                conflict.getGroup().getGroupName()));
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
