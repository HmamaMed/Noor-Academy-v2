package com.nooracademy.testimonial;

import com.nooracademy.enrollment.EnrollmentStatus;
import com.nooracademy.group.GroupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    boolean existsByEnrollmentId(Long enrollmentId);
    List<Testimonial> findByEnrollmentStudentIdOrderByCreatedAtDesc(Long studentId);
    Page<Testimonial> findByStatus(TestimonialStatus status, Pageable pageable);
    Page<Testimonial> findByStatusAndEnrollmentStatusAndEnrollmentGroupStatus(
            TestimonialStatus status, EnrollmentStatus enrollmentStatus, GroupStatus groupStatus, Pageable pageable);
}
