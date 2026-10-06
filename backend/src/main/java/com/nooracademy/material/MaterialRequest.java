package com.nooracademy.material;
import jakarta.validation.constraints.*;
public record MaterialRequest(@NotBlank @Size(max = 200) String title,
        @Size(max = 20000) String description, @NotNull MaterialType type,
        @Size(max = 2000) String externalUrl) {}
