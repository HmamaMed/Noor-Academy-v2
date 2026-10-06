package com.nooracademy.material;

import com.nooracademy.security.CurrentUser;
import com.nooracademy.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/workspaces/{groupId}")
public class MaterialController {
    private final MaterialService service;
    @GetMapping public WorkspaceResponse workspace(@PathVariable Long groupId, @CurrentUser User actor) {
        return service.workspace(groupId, actor);
    }
    @PostMapping(value = "/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse create(@PathVariable Long groupId, @CurrentUser User actor,
            @Valid @RequestPart("metadata") MaterialRequest metadata,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return service.create(groupId, actor, metadata, file);
    }
    @GetMapping("/materials/{id}/file")
    public ResponseEntity<byte[]> download(@PathVariable Long groupId, @PathVariable Long id, @CurrentUser User actor) {
        var download = service.download(groupId, id, actor);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(download.name(), StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .header("X-Content-Type-Options", "nosniff").body(download.bytes());
    }
    @DeleteMapping("/materials/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long groupId, @PathVariable Long id, @CurrentUser User actor) { service.delete(groupId, id, actor); }
}
