package com.nooracademy.storage;

import com.nooracademy.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** One academy-owned OAuth account. Secrets stay on the backend; files stay private on Drive. */
@Component @Slf4j
public class DriveStorage {
    private final RestClient client;
    public DriveStorage() { this(RestClient.builder().requestFactory(requestFactory())); }
    private static org.springframework.http.client.JdkClientHttpRequestFactory requestFactory() {
        var factory = new org.springframework.http.client.JdkClientHttpRequestFactory(java.net.http.HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(15)).build());
        factory.setReadTimeout(java.time.Duration.ofSeconds(60));
        return factory;
    }
    public DriveStorage(RestClient.Builder builder) { this.client = builder.build(); }
    @Value("${app.drive.client-id:}") private String clientId;
    @Value("${app.drive.client-secret:}") private String clientSecret;
    @Value("${app.drive.refresh-token:}") private String refreshToken;
    @Value("${app.drive.folder-id:}") private String folderId;
    private String accessToken;
    private Instant tokenExpiresAt = Instant.EPOCH;

    public boolean enabled() {
        return !clientId.isBlank() && !clientSecret.isBlank() && !refreshToken.isBlank() && !folderId.isBlank();
    }

    private synchronized String token() {
        if (!enabled()) throw new BadRequestException("Drive uploads are not configured yet. You can share an existing Drive link.");
        if (accessToken != null && tokenExpiresAt.isAfter(Instant.now().plusSeconds(60))) return accessToken;
        var form = new LinkedMultiValueMap<String, String>();
        form.add("client_id", clientId); form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken); form.add("grant_type", "refresh_token");
        Map<?, ?> response = client.post().uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
        if (response == null || !(response.get("access_token") instanceof String value)) {
            throw new BadRequestException("Google Drive authorization failed. Ask the administrator to reconnect storage.");
        }
        accessToken = value;
        tokenExpiresAt = Instant.now().plusSeconds(((Number) response.getOrDefault("expires_in", null)).longValue());
        return accessToken;
    }

    public String upload(String name, String mimeType, byte[] bytes) {
        try {
            ResponseEntity<Void> session = client.post()
                    .uri("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true")
                    .headers(h -> h.setBearerAuth(token())).contentType(MediaType.APPLICATION_JSON)
                    .header("X-Upload-Content-Type", mimeType).header("X-Upload-Content-Length", String.valueOf(bytes.length))
                    .body(Map.of("name", name, "parents", List.of(folderId)))
                    .retrieve().toBodilessEntity();
            java.net.URI location = session.getHeaders().getLocation();
            if (location == null || !"https".equals(location.getScheme()) || !"www.googleapis.com".equals(location.getHost())) {
                throw new BadRequestException("Google Drive did not provide a valid upload session");
            }
            Map<?, ?> uploaded = client.put().uri(location).headers(h -> h.setBearerAuth(token()))
                    .contentType(MediaType.parseMediaType(mimeType)).body(bytes).retrieve().body(Map.class);
            if (uploaded == null || !(uploaded.get("id") instanceof String id)) throw new BadRequestException("Drive upload failed");
            return id;
        } catch (RestClientException ex) {
            log.warn("Drive upload failed ({})", ex.getClass().getSimpleName());
            throw new BadRequestException("Google Drive upload failed. Check storage authorization and quota, then try again.");
        }
    }

    public byte[] download(String fileId) {
        try {
            return client.get().uri("https://www.googleapis.com/drive/v3/files/{id}?alt=media&supportsAllDrives=true", fileId)
                    .headers(h -> h.setBearerAuth(token())).retrieve().body(byte[].class);
        } catch (RestClientException ex) {
            throw new BadRequestException("The file could not be downloaded from Google Drive. Try again or contact your teacher.");
        }
    }

    public void delete(String fileId) {
        try {
            client.delete().uri("https://www.googleapis.com/drive/v3/files/{id}?supportsAllDrives=true", fileId)
                    .headers(h -> h.setBearerAuth(token())).retrieve().toBodilessEntity();
        } catch (RuntimeException ex) {
            log.warn("Drive cleanup failed for file {}. Remove it manually from the academy folder.", fileId);
        }
    }
}
