package com.nooracademy.storage;

import com.nooracademy.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class R2StorageTests {
    @Test void configuredAdapterInitializesClientsWithoutNetworkCalls() {
        var storage = new R2Storage(new R2Properties("https://test.r2.cloudflarestorage.com", "private-materials", "test-access", "test-secret", "auto"));
        try {
            assertTrue(storage.enabled());
        } finally {
            storage.close();
        }
    }
    @Test void privateUploadUsesRandomKeyAndDownloadOnlyContentType() throws Exception {
        var client = mock(S3Client.class);
        var storage = new R2Storage(client, mock(S3Presigner.class), "private-materials");
        String key = storage.upload("lesson.html", "private lesson".getBytes());
        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        var body = ArgumentCaptor.forClass(RequestBody.class);
        verify(client).putObject(request.capture(), body.capture());
        assertTrue(key.matches("materials/[a-f0-9-]{36}"));
        assertEquals("private-materials", request.getValue().bucket());
        assertEquals(key, request.getValue().key());
        assertNull(request.getValue().acl());
        assertEquals("application/octet-stream", request.getValue().contentType());
        assertTrue(request.getValue().contentDisposition().startsWith("attachment;"));
        try (var stream = body.getValue().contentStreamProvider().newStream()) {
            assertArrayEquals("private lesson".getBytes(), stream.readAllBytes());
        }
    }

    @Test void signedDownloadChecksObjectAndExpiresInFiveMinutes() {
        var client = mock(S3Client.class);
        try (var presigner = S3Presigner.builder()
                .endpointOverride(URI.create("https://test.r2.cloudflarestorage.com"))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("test-access", "test-secret")))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).checksumValidationEnabled(false).build()).build()) {
            var storage = new R2Storage(client, presigner, "private-materials");
            Instant before = Instant.now();
            var link = storage.download("materials/private-key", "lesson.pdf");
            assertEquals("test.r2.cloudflarestorage.com", URI.create(link.url()).getHost());
            assertTrue(link.url().contains("/private-materials/materials/private-key"));
            assertTrue(link.url().contains("X-Amz-Expires=300"));
            assertTrue(link.url().contains("X-Amz-Signature="));
            assertTrue(link.url().contains("X-Amz-SignedHeaders=host"));
            assertTrue(link.url().contains("response-content-disposition="));
            assertFalse(link.url().contains("test-secret"));
            assertTrue(link.expiresAt().isAfter(before.plusSeconds(295)));
            assertTrue(link.expiresAt().isBefore(Instant.now().plusSeconds(301)));
            verify(client).headObject(HeadObjectRequest.builder().bucket("private-materials").key("materials/private-key").build());
        }
    }

    @Test void missingObjectDoesNotIssueLinkOrExposeProviderError() {
        var client = mock(S3Client.class);
        var signer = mock(S3Presigner.class);
        when(client.headObject(any(HeadObjectRequest.class))).thenThrow(NoSuchKeyException.builder().message("private provider detail").build());
        var storage = new R2Storage(client, signer, "private-materials");
        var error = assertThrows(BadRequestException.class, () -> storage.download("missing", "lesson.pdf"));
        assertFalse(error.getMessage().contains("private provider detail"));
        verifyNoInteractions(signer);
    }

    @Test void failedUploadAttemptsCleanupWithoutLeakingCredentials() {
        var client = mock(S3Client.class);
        when(client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenThrow(S3Exception.builder().message("secret error detail").statusCode(403).build());
        var storage = new R2Storage(client, mock(S3Presigner.class), "private-materials");
        var error = assertThrows(BadRequestException.class, () -> storage.upload("lesson.pdf", new byte[]{1}));
        assertFalse(error.getMessage().contains("secret error detail"));
        verify(client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test void incompleteConfigurationLeavesStorageDisabledWithoutNetworkCalls() {
        var properties = new R2Properties("", "", "", "", "auto");
        var storage = new R2Storage(properties);
        assertFalse(storage.enabled());
        assertThrows(BadRequestException.class, () -> storage.upload("lesson.pdf", new byte[]{1}));
        assertThrows(BadRequestException.class, () -> storage.download("key", "lesson.pdf"));
        assertFalse(new R2Properties("endpoint", "bucket", "private-key", "private-secret", "auto").toString().contains("private-secret"));
    }

    @Test void endpointRequiresCloudflareHttpsOriginAndAcceptsJurisdictions() {
        assertNotNull(R2Storage.endpoint("https://account.eu.r2.cloudflarestorage.com"));
        for (String value : new String[]{"http://account.r2.cloudflarestorage.com", "https://example.com", "https://account.r2.cloudflarestorage.com/bucket", "https://secret@account.r2.cloudflarestorage.com", "https://account.r2.cloudflarestorage.com?token=private"}) {
            assertThrows(IllegalArgumentException.class, () -> R2Storage.endpoint(value));
        }
    }

}
