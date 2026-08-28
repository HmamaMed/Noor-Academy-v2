package com.nooracademy.enrollment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.enrollment")
public record EnrollmentProperties(long pendingExpiryHours) {
}
