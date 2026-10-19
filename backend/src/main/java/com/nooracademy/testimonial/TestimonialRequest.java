package com.nooracademy.testimonial;

import jakarta.validation.constraints.*;

public record TestimonialRequest(
        @NotNull Long enrollmentId,
        @NotBlank @Size(min = 20, max = 1200) String content,
        @NotNull @AssertTrue(message = "Please agree to public sharing before submitting") Boolean publicConsent
) {}
