package com.nooracademy.material;
import java.time.Instant;
public record MaterialResponse(Long id, Long groupId, String title, String description, MaterialType type,
        String externalUrl, boolean hasFile, String fileName, Long fileSize, String authorName, Instant createdAt) {}
