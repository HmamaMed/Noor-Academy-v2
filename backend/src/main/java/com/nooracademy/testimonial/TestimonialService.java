package com.nooracademy.testimonial;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.common.exception.ConflictException;
import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.enrollment.EnrollmentRepository;
import com.nooracademy.enrollment.EnrollmentStatus;
import com.nooracademy.group.GroupStatus;
import com.nooracademy.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TestimonialService {
    private final TestimonialRepository testimonials;
    private final EnrollmentRepository enrollments;
    private static final Sort NEWEST = Sort.by(Sort.Direction.DESC, "createdAt", "id");

    public record PublicTestimonial(Long id, String content, String studentName, String courseTitle) {}
    public record Response(Long id, Long enrollmentId, String content, String studentName,
                           String courseTitle, String groupName, TestimonialStatus status, Instant createdAt) {}
    public record ReviewPage(List<Response> content, long totalElements, int totalPages) {}

    @Transactional(readOnly = true)
    public List<PublicTestimonial> published() {
        return testimonials.findByStatusAndEnrollmentStatusAndEnrollmentGroupStatus(
                TestimonialStatus.APPROVED, EnrollmentStatus.CONFIRMED, GroupStatus.COMPLETED,
                PageRequest.of(0, 6, NEWEST)).stream().map(testimonial -> {
            var enrollment = testimonial.getEnrollment();
            var student = enrollment.getStudent();
            String lastName = student.getLastName().trim();
            String initial = lastName.isEmpty() ? "" : " " + new String(Character.toChars(lastName.codePointAt(0))).toUpperCase(java.util.Locale.ROOT) + ".";
            return new PublicTestimonial(testimonial.getId(), testimonial.getContent(),
                    student.getFirstName().trim() + initial, enrollment.getGroup().getCourse().getTitle());
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Response> mine(Long studentId) {
        return testimonials.findByEnrollmentStudentIdOrderByCreatedAtDesc(studentId).stream().map(this::response).toList();
    }

    @Transactional
    public Response submit(User student, TestimonialRequest request) {
        if (!Boolean.TRUE.equals(request.publicConsent())) {
            throw new BadRequestException("Please agree to public sharing before submitting.");
        }
        var enrollment = enrollments.findById(request.enrollmentId())
                .filter(item -> item.getStudent().getId().equals(student.getId()))
                .orElseThrow(() -> new NotFoundException("Enrollment not found"));
        if (enrollment.getStatus() != EnrollmentStatus.CONFIRMED || enrollment.getGroup().getStatus() != GroupStatus.COMPLETED) {
            throw new BadRequestException("You can share a testimonial after your confirmed class is marked completed.");
        }
        if (testimonials.existsByEnrollmentId(enrollment.getId())) {
            throw new ConflictException("You have already shared a testimonial for this class.");
        }
        String content = request.content().trim();
        if (content.length() < 20) throw new BadRequestException("Please write at least 20 characters about your experience.");
        var testimonial = new Testimonial();
        testimonial.setEnrollment(enrollment);
        testimonial.setContent(content);
        testimonial.setStatus(TestimonialStatus.PENDING);
        testimonial.setCreatedAt(Instant.now());
        return response(testimonials.save(testimonial));
    }

    @Transactional
    public void withdraw(Long id, Long studentId) {
        var testimonial = testimonials.findById(id)
                .filter(item -> item.getEnrollment().getStudent().getId().equals(studentId))
                .orElseThrow(() -> new NotFoundException("Testimonial not found"));
        testimonials.delete(testimonial);
    }

    @Transactional(readOnly = true)
    public ReviewPage review(TestimonialStatus status, int page) {
        var pageable = PageRequest.of(Math.max(0, page), 20, NEWEST);
        var result = status == null ? testimonials.findAll(pageable) : testimonials.findByStatus(status, pageable);
        return new ReviewPage(result.stream().map(this::response).toList(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public Response moderate(Long id, TestimonialStatus status) {
        var testimonial = testimonials.findById(id).orElseThrow(() -> new NotFoundException("Testimonial not found"));
        if (status == TestimonialStatus.APPROVED && (testimonial.getEnrollment().getStatus() != EnrollmentStatus.CONFIRMED
                || testimonial.getEnrollment().getGroup().getStatus() != GroupStatus.COMPLETED)) {
            throw new BadRequestException("Only testimonials from confirmed students in completed classes can be published.");
        }
        testimonial.setStatus(status);
        return response(testimonial);
    }

    private Response response(Testimonial testimonial) {
        var enrollment = testimonial.getEnrollment();
        var student = enrollment.getStudent();
        return new Response(testimonial.getId(), enrollment.getId(), testimonial.getContent(),
                student.getFirstName() + " " + student.getLastName(), enrollment.getGroup().getCourse().getTitle(),
                enrollment.getGroup().getGroupName(), testimonial.getStatus(), testimonial.getCreatedAt());
    }
}
