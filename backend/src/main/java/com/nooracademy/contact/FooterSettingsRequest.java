package com.nooracademy.contact;

import jakarta.validation.constraints.*;

public record FooterSettingsRequest(
        @NotNull @Email @Size(max = 254) String email,
        @NotNull @Size(max = 40) @Pattern(regexp = "[+0-9() .-]*") String phone,
        @NotNull @Size(max = 500) @Pattern(regexp = "^$|https://[^\\s]+") String instagramUrl,
        @NotNull @Size(max = 500) @Pattern(regexp = "^$|https://[^\\s]+") String facebookUrl,
        @NotNull @Size(max = 500) @Pattern(regexp = "^$|https://[^\\s]+") String whatsappUrl,
        @NotNull @Size(max = 160) String locationName,
        @NotNull @Size(max = 300) String address,
        @DecimalMin("-85") @DecimalMax("85") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude
) {
    @AssertTrue(message = "Enter both latitude and longitude, or leave both empty")
    public boolean isCoordinatePairValid() {
        return (latitude == null) == (longitude == null);
    }
}
