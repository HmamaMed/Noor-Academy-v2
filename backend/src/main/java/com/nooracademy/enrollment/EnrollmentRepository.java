package com.nooracademy.enrollment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    int countByGroupIdAndStatus(Long groupId, EnrollmentStatus status);

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByGroupId(Long groupId);

    List<Enrollment> findByGroupIdAndStatus(Long groupId, EnrollmentStatus status);

    Optional<Enrollment> findByStudentIdAndGroupId(Long studentId, Long groupId);

    List<Enrollment> findByStatusAndAppliedAtBefore(EnrollmentStatus status, Instant cutoff);
}
