package com.nooracademy.storage;

import com.nooracademy.common.exception.BadRequestException;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
@Slf4j
public class R2Storage {
    private static final Duration DOWNLOAD_LIFETIME = Duration.ofMinutes(5);
    private final S3Client client;
    private final S3Presigner presigner;
    private final String bucket;

    @Autowired
    public R2Storage(R2Properties properties) {
        bucket = properties.bucket();
        if (!properties.configured()) {
            client = null;
            presigner = null;
            return;
        }
        URI endpoint = endpoint(properties.endpoint());
        var credentials = StaticCredentialsProvider.create(AwsBasicCredentials.create(properties.accessKeyId(), properties.secretAccessKey()));
        var region = Region.of(properties.region());
        var configuration = S3Configuration.builder().pathStyleAccessEnabled(true).chunkedEncodingEnabled(false).build();
        client = S3Client.builder()
                .endpointOverride(endpoint).region(region).credentialsProvider(credentials)
                .serviceConfiguration(configuration)
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .httpClientBuilder(UrlConnectionHttpClient.builder().connectionTimeout(Duration.ofSeconds(10)).socketTimeout(Duration.ofSeconds(60)))
                .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(90)).apiCallAttemptTimeout(Duration.ofSeconds(65)))
                .build();
        presigner = S3Presigner.builder().endpointOverride(endpoint).region(region).credentialsProvider(credentials)
                .serviceConfiguration(configuration.toBuilder().checksumValidationEnabled(false).build()).build();
    }

    R2Storage(S3Client client, S3Presigner presigner, String bucket) {
        this.client = client;
        this.presigner = presigner;
        this.bucket = bucket;
    }

    static URI endpoint(String value) {
        try {
            URI uri = URI.create(value);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null
                    || !uri.getHost().endsWith(".r2.cloudflarestorage.com") || uri.getUserInfo() != null
                    || uri.getQuery() != null || uri.getFragment() != null || (uri.getPort() != -1 && uri.getPort() != 443)
                    || !(uri.getPath().isEmpty() || uri.getPath().equals("/"))) throw new IllegalArgumentException();
            return uri;
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("R2_ENDPOINT must be the HTTPS S3 endpoint displayed by Cloudflare, without a bucket or path");
        }
    }

    public boolean enabled() { return client != null && presigner != null; }

    private void requireEnabled() {
        if (!enabled()) throw new BadRequestException("File storage is not configured yet. Ask the administrator to configure R2, or publish text and a resource link.");
    }

    public String upload(String name, byte[] bytes) {
        requireEnabled();
        String key = "materials/" + UUID.randomUUID();
        try {
            client.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
                    .contentType("application/octet-stream").contentDisposition(disposition(name)).build(), RequestBody.fromBytes(bytes));
            return key;
        } catch (SdkException ex) {
            log.warn("R2 upload failed ({})", ex.getClass().getSimpleName());
            // A timed-out PUT may have succeeded remotely. Best-effort cleanup avoids orphan objects.
            delete(key);
            throw new BadRequestException("File upload failed. Check R2 credentials, bucket permissions and quota, then try again.");
        }
    }

    public DownloadLink download(String key, String name) {
        requireEnabled();
        try {
            // Signing is local; check existence first so missing objects/credentials produce an in-app error.
            client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            var signed = presigner.presignGetObject(GetObjectPresignRequest.builder().signatureDuration(DOWNLOAD_LIFETIME)
                    .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key)
                            .responseContentType("application/octet-stream").responseContentDisposition(disposition(name)).build()).build());
            if (!signed.isBrowserExecutable()) throw new BadRequestException("Could not create a browser download. Ask the administrator to check file storage.");
            return new DownloadLink(signed.url().toString(), signed.expiration());
        } catch (SdkException ex) {
            log.warn("R2 download failed ({})", ex.getClass().getSimpleName());
            throw new BadRequestException("The attachment is unavailable. Try again or ask your teacher to check file storage.");
        }
    }

    public void delete(String key) {
        try {
            requireEnabled();
            client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (RuntimeException ex) {
            log.warn("R2 cleanup failed for object {} ({}). Remove it manually from the private bucket.", key, ex.getClass().getSimpleName());
        }
    }

    private static String disposition(String name) {
        return ContentDisposition.attachment().filename(name == null ? "attachment" : name, StandardCharsets.UTF_8).build().toString();
    }

    @PreDestroy
    public void close() {
        if (client != null) client.close();
        if (presigner != null) presigner.close();
    }

    public record DownloadLink(String url, Instant expiresAt) {}
}
