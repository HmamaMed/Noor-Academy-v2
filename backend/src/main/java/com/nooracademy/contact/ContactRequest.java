package com.nooracademy.contact;

import jakarta.validation.constraints.*;

public record ContactRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 160) String subject,
        @NotBlank @Size(max = 5000) String message
) {}
