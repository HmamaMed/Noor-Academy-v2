package com.nooracademy.testimonial;

import com.nooracademy.security.CurrentUser;
import com.nooracademy.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/testimonials")
@RequiredArgsConstructor
public class TestimonialController {
    private final TestimonialService testimonials;

    @GetMapping
    public List<TestimonialService.PublicTestimonial> published() { return testimonials.published(); }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<TestimonialService.Response> mine(@CurrentUser User student) { return testimonials.mine(student.getId()); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public TestimonialService.Response submit(@CurrentUser User student, @Valid @RequestBody TestimonialRequest request) {
        return testimonials.submit(student, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('STUDENT')")
    public void withdraw(@PathVariable Long id, @CurrentUser User student) { testimonials.withdraw(id, student.getId()); }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public TestimonialService.ReviewPage review(@RequestParam(required = false) TestimonialStatus status,
                                               @RequestParam(defaultValue = "0") int page) {
        return testimonials.review(status, page);
    }

    public record ModerationRequest(@NotNull TestimonialStatus status) {}

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public TestimonialService.Response moderate(@PathVariable Long id, @Valid @RequestBody ModerationRequest request) {
        return testimonials.moderate(id, request.status());
    }
}
