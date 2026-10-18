package com.nooracademy.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.storage.r2")
public record R2Properties(String endpoint, String bucket, String accessKeyId, String secretAccessKey, String region) {
    public boolean configured() {
        return present(endpoint) && present(bucket) && present(accessKeyId) && present(secretAccessKey);
    }

    private static boolean present(String value) {
        return value != null && !value.isBlank();
    }

    // Configuration records must never render credentials into logs or diagnostics.
    @Override public String toString() { return "R2Properties[configured=" + configured() + "]"; }
}
