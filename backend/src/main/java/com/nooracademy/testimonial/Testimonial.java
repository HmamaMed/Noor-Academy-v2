package com.nooracademy.testimonial;

import com.nooracademy.enrollment.Enrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "testimonials")
@Getter @Setter @NoArgsConstructor
public class Testimonial {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;
    @Column(nullable = false, length = 1200)
    private String content;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestimonialStatus status;
    @Column(nullable = false)
    private Instant createdAt;
}
