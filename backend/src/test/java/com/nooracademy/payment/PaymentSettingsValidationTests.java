package com.nooracademy.payment;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PaymentSettingsValidationTests {
    @Test void bankDetailsAreOptionalButMustBeCompleteBeforePublication() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new PaymentSettingsRequest("", "", "", "", "", "")).isEmpty());
            assertTrue(validator.validate(new PaymentSettingsRequest("Bank", "Academy", "123 456", "", "", "")).isEmpty());
            assertFalse(validator.validate(new PaymentSettingsRequest("Bank", "", "123 456", "", "", "")).isEmpty());
            assertFalse(validator.validate(new PaymentSettingsRequest("Bank", "Academy", "invalid<script>", "", "", "")).isEmpty());
            assertFalse(validator.validate(new PaymentSettingsRequest(null, "", "", "", "", "")).isEmpty());
        }
    }
}
