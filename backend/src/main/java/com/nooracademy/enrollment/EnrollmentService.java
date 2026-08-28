package com.nooracademy.enrollment;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.common.exception.ConflictException;
import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.enrollment.dto.EnrollmentResponse;
import com.nooracademy.group.Group;
import com.nooracademy.group.GroupRepository;
import com.nooracademy.user.Role;
import com.nooracademy.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final GroupRepository groupRepository;
    private final EnrollmentProperties enrollmentProperties;

    @Transactional
    public EnrollmentResponse apply(User student, Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found: " + groupId));

        enrollmentRepository.findByStudentIdAndGroupId(student.getId(), groupId).ifPresent(existing -> {
            if (existing.getStatus() != EnrollmentStatus.CANCELLED) {
                throw new BadRequestException("You already have an application for this group");
            }
        });

        int confirmedSeats = enrollmentRepository.countByGroupIdAndStatus(groupId, EnrollmentStatus.CONFIRMED);
        if (confirmedSeats >= group.getRoom().getMaxCapacity()) {
            throw new ConflictException("This group is full");
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .group(group)
                .status(EnrollmentStatus.PENDING)
                .appliedAt(Instant.now())
                .build();

        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public EnrollmentResponse confirm(Long enrollmentId) {
        Enrollment enrollment = getOrThrow(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BadRequestException("Only pending applications can be confirmed");
        }
        int confirmedSeats = enrollmentRepository.countByGroupIdAndStatus(
                enrollment.getGroup().getId(), EnrollmentStatus.CONFIRMED);
        if (confirmedSeats >= enrollment.getGroup().getRoom().getMaxCapacity()) {
            throw new ConflictException("This group is full");
        }
        enrollment.setStatus(EnrollmentStatus.CONFIRMED);
        enrollment.setConfirmedAt(Instant.now());
        return toResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse cancel(Long enrollmentId, User actor) {
        Enrollment enrollment = getOrThrow(enrollmentId);
        boolean isOwner = enrollment.getStudent().getId().equals(actor.getId());
        if (actor.getRole() == Role.STUDENT && !isOwner) {
            throw new BadRequestException("You can only cancel your own applications");
        }
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        return toResponse(enrollment);
    }

    public List<EnrollmentResponse> findMine(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    public List<EnrollmentResponse> findByGroup(Long groupId, EnrollmentStatus status) {
        List<Enrollment> enrollments = status == null
                ? enrollmentRepository.findByGroupId(groupId)
                : enrollmentRepository.findByGroupIdAndStatus(groupId, status);
        return enrollments.stream().map(this::toResponse).toList();
    }

    /**
     * Auto-cancels applications that have sat PENDING beyond the configured window
     * (72h by default) without admin confirmation, freeing the seat back up.
     */
    @Scheduled(fixedRate = 15, timeUnit = java.util.concurrent.TimeUnit.MINUTES)
    @Transactional
    public void autoCancelExpiredApplications() {
        Instant cutoff = Instant.now().minus(enrollmentProperties.pendingExpiryHours(), ChronoUnit.HOURS);
        List<Enrollment> expired = enrollmentRepository.findByStatusAndAppliedAtBefore(EnrollmentStatus.PENDING, cutoff);
        if (expired.isEmpty()) {
            return;
        }
        expired.forEach(e -> e.setStatus(EnrollmentStatus.CANCELLED));
        enrollmentRepository.saveAll(expired);
        log.info("Auto-cancelled {} expired pending enrollment(s)", expired.size());
    }

    private Enrollment getOrThrow(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Enrollment not found: " + id));
    }

    private EnrollmentResponse toResponse(Enrollment e) {
        Instant expiresAt = e.getStatus() == EnrollmentStatus.PENDING
                ? e.getAppliedAt().plus(enrollmentProperties.pendingExpiryHours(), ChronoUnit.HOURS)
                : null;
        return new EnrollmentResponse(
                e.getId(),
                e.getGroup().getId(),
                e.getGroup().getGroupName(),
                e.getGroup().getCourse().getTitle(),
                e.getStudent().getId(),
                e.getStudent().getFirstName() + " " + e.getStudent().getLastName(),
                e.getStatus(),
                e.getAppliedAt(),
                e.getConfirmedAt(),
                expiresAt
        );
    }
}
