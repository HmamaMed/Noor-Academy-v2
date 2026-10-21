package com.nooracademy.payment;
import jakarta.validation.constraints.*;

public record PaymentSettingsRequest(
        @NotNull @Size(max = 160) String bankName,
        @NotNull @Size(max = 160) String accountHolder,
        @NotNull @Size(max = 80) @Pattern(regexp = "[A-Za-z0-9 .-]*") String rib,
        @NotNull @Size(max = 1000) String bankInstructions,
        @NotNull @Size(max = 1000) String visitInstructions,
        @NotNull @Size(max = 300) String openingHours
) {
    @AssertTrue(message = "Enter the bank name, account holder, and RIB together, or leave all three empty")
    public boolean isBankDetailsComplete() {
        if (bankName == null || accountHolder == null || rib == null) return true;
        return (bankName.isBlank() && accountHolder.isBlank() && rib.isBlank())
                || (!bankName.isBlank() && !accountHolder.isBlank() && !rib.isBlank());
    }
}
