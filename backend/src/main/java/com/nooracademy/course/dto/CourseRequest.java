package com.nooracademy.course.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;

public record CourseRequest(
        @NotBlank String title,
        String description,
        String syllabus,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price,
        @Min(1) @Max(10000) @JsonDeserialize(using = SessionCountDeserializer.class) Integer totalSessions
) {
    /** Reject fractional JSON values instead of allowing integer coercion to truncate them. */
    public static class SessionCountDeserializer extends ValueDeserializer<Integer> {
        @Override public Integer deserialize(JsonParser parser, DeserializationContext context) {
            if (!parser.isExpectedNumberIntToken()) {
                return context.reportInputMismatch(Integer.class, "Total sessions must be a whole number");
            }
            return parser.getIntValue();
        }
    }
}
