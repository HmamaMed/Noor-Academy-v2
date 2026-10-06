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
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final GroupRepository groupRepository;
    private final EnrollmentProperties enrollmentProperties;
    private final jakarta.persistence.EntityManager entityManager;
    private final org.springframework.context.ApplicationEventPublisher events;

    private void notifyStudent(Enrollment enrollment, String message) {
        events.publishEvent(new com.nooracademy.notification.MailNotification(enrollment.getStudent().getEmail(),
                "Noor Academy enrollment update", message + ": " + enrollment.getGroup().getGroupName()));
    }

    private void validateOpen(Group group) {
        if (group.getStatus() != com.nooracademy.group.GroupStatus.ACTIVE || group.getEndDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException("This group is not open for enrollment");
        }
    }

    @Transactional
    public EnrollmentResponse apply(User student, Long groupId) {
        Group group = groupRepository.findLockedById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found: " + groupId));

        validateOpen(group);
        Enrollment existing = enrollmentRepository.findByStudentIdAndGroupId(student.getId(), groupId).orElse(null);
        if (existing != null && existing.getStatus() != EnrollmentStatus.CANCELLED) {
            throw new BadRequestException("You already have an application for this group");
        }

        int confirmedSeats = enrollmentRepository.countByGroupIdAndStatus(groupId, EnrollmentStatus.CONFIRMED);
        if (confirmedSeats >= group.getRoom().getMaxCapacity()) {
            throw new ConflictException("This group is full");
        }

        Enrollment enrollment = existing == null ? new Enrollment() : existing;
        enrollment.setStudent(student);
        enrollment.setGroup(group);
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment.setAppliedAt(Instant.now());
        enrollment.setConfirmedAt(null);

        enrollmentRepository.save(enrollment);
        notifyStudent(enrollment, "Application received. Please arrange payment with the academy within 72 hours");
        return toResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse confirm(Long enrollmentId) {
        Enrollment enrollment = getOrThrow(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BadRequestException("Only pending applications can be confirmed");
        }
        validateOpen(enrollment.getGroup());
        if (!enrollment.getAppliedAt().plus(enrollmentProperties.pendingExpiryHours(), ChronoUnit.HOURS).isAfter(Instant.now())) {
            throw new BadRequestException("This application has expired; cancel it and apply again");
        }
        int confirmedSeats = enrollmentRepository.countByGroupIdAndStatus(
                enrollment.getGroup().getId(), EnrollmentStatus.CONFIRMED);
        if (confirmedSeats >= enrollment.getGroup().getRoom().getMaxCapacity()) {
            throw new ConflictException("This group is full");
        }
        enrollment.setStatus(EnrollmentStatus.CONFIRMED);
        enrollment.setConfirmedAt(Instant.now());
        notifyStudent(enrollment, "Your enrollment is confirmed. Your class workspace is now available");
        return toResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse cancel(Long enrollmentId, User actor) {
        Enrollment enrollment = getOrThrow(enrollmentId);
        boolean isOwner = enrollment.getStudent().getId().equals(actor.getId());
        if (actor.getRole() == Role.STUDENT && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("You can only cancel your own applications");
        }
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        notifyStudent(enrollment, "Your enrollment has been cancelled");
        return toResponse(enrollment);
    }

    public List<EnrollmentResponse> findMine(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    public List<EnrollmentResponse> findByGroup(Long groupId, EnrollmentStatus status, User actor) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("Group not found"));
        if (actor.getRole() == Role.TEACHER && !group.getTeacher().getId().equals(actor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("This group is not assigned to you");
        }
        if (actor.getRole() == Role.TEACHER) status = EnrollmentStatus.CONFIRMED;
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
        // Serialize with confirmations, then reload so we never overwrite a just-confirmed enrollment.
        for (Long id : expired.stream().sorted(java.util.Comparator.comparing(e -> e.getGroup().getId())).map(Enrollment::getId).toList()) {
            Enrollment enrollment = getOrThrow(id);
            if (enrollment.getStatus() == EnrollmentStatus.PENDING && enrollment.getAppliedAt().isBefore(cutoff)) {
                enrollment.setStatus(EnrollmentStatus.CANCELLED);
                notifyStudent(enrollment, "Your application expired after 72 hours without confirmation");
            }
        }
        log.info("Auto-cancelled {} expired pending enrollment(s)", expired.size());
    }

    private Enrollment getOrThrow(Long id) {
        Long groupId = enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Enrollment not found: " + id)).getGroup().getId();
        groupRepository.findLockedById(groupId).orElseThrow(() -> new NotFoundException("Group not found"));
        Enrollment enrollment = enrollmentRepository.findById(id).orElseThrow();
        entityManager.refresh(enrollment);
        return enrollment;
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
                expiresAt,
                e.getGroup().getStatus(),
                e.getGroup().getTeacher().getFirstName() + " " + e.getGroup().getTeacher().getLastName(),
                e.getGroup().getRoom().getName(),
                e.getGroup().getStartDate(), e.getGroup().getEndDate(),
                e.getGroup().getSessions().stream().map(s -> new com.nooracademy.session.dto.SessionResponse(
                        s.getId(), s.getDayOfWeek(), s.getStartTime(), s.getEndTime())).toList()
        );
    }
}
