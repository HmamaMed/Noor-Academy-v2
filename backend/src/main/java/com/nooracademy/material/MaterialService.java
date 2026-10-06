package com.nooracademy.material;

import com.nooracademy.common.exception.*;
import com.nooracademy.enrollment.*;
import com.nooracademy.group.*;
import com.nooracademy.storage.DriveStorage;
import com.nooracademy.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Set;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class MaterialService {
    private final MaterialRepository materials;
    private final GroupRepository groups;
    private final GroupService groupService;
    private final EnrollmentRepository enrollments;
    private final DriveStorage drive;

    public WorkspaceResponse workspace(Long groupId, User actor) {
        Group group = accessibleGroup(groupId, actor, false);
        return new WorkspaceResponse(groupService.findById(groupId), canManage(group, actor), drive.enabled(),
                materials.findByGroupIdOrderByCreatedAtDesc(groupId).stream().map(this::response).toList());
    }

    private boolean canManage(Group group, User actor) {
        return actor.getRole() == Role.ADMIN || (actor.getRole() == Role.TEACHER && group.getTeacher().getId().equals(actor.getId()));
    }

    private Group accessibleGroup(Long id, User actor, boolean manage) {
        Group group = groups.findById(id).orElseThrow(() -> new NotFoundException("Group not found"));
        if (canManage(group, actor)) return group;
        if (!manage && actor.getRole() == Role.STUDENT && enrollments.existsByStudentIdAndGroupIdAndStatus(actor.getId(), id, EnrollmentStatus.CONFIRMED)) return group;
        throw new AccessDeniedException("You do not have access to this class workspace");
    }

    @Transactional
    public MaterialResponse create(Long groupId, User actor, MaterialRequest request, MultipartFile file) {
        Group group = accessibleGroup(groupId, actor, true);
        String url = validateUrl(request.externalUrl());
        if ((request.description() == null || request.description().isBlank()) && url == null && (file == null || file.isEmpty())) {
            throw new BadRequestException("Add lesson text, a Drive link, or a file");
        }
        Material material = new Material();
        material.setGroup(group); material.setAuthor(actor); material.setTitle(request.title().trim());
        material.setDescription(request.description()); material.setType(request.type());
        material.setExternalUrl(url); material.setCreatedAt(Instant.now());
        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 25L * 1024 * 1024) throw new BadRequestException("Files must be 25 MB or smaller");
            String name = file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename().replaceAll("[\\\\/\r\n]", "_");
            if (name.length() > 200) name = name.substring(name.length() - 200);
            try {
                String id = drive.upload(name, file.getContentType() == null ? "application/octet-stream" : file.getContentType(), file.getBytes());
                material.setDriveFileId(id); material.setFileName(name); material.setFileSize(file.getSize());
                // Compensate if the DB transaction fails after the external upload succeeds.
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCompletion(int status) { if (status != STATUS_COMMITTED) drive.delete(id); }
                });
            } catch (IOException ex) { throw new BadRequestException("Could not read the uploaded file"); }
        }
        return response(materials.saveAndFlush(material));
    }

    static String validateUrl(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            URI uri = URI.create(value.trim());
            if (!"https".equals(uri.getScheme()) || !Set.of("drive.google.com", "docs.google.com").contains(uri.getHost())
                    || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) throw new IllegalArgumentException();
            return uri.toString();
        } catch (IllegalArgumentException ex) { throw new BadRequestException("Use an HTTPS Google Drive or Google Docs link"); }
    }

    public Download download(Long groupId, Long id, User actor) {
        accessibleGroup(groupId, actor, false);
        Material material = get(groupId, id);
        if (material.getDriveFileId() == null) throw new NotFoundException("No uploaded file attached");
        return new Download(material.getFileName(), drive.download(material.getDriveFileId()));
    }
    public record Download(String name, byte[] bytes) {}

    @Transactional
    public void delete(Long groupId, Long id, User actor) {
        accessibleGroup(groupId, actor, true);
        Material material = get(groupId, id);
        String fileId = material.getDriveFileId();
        materials.delete(material);
        if (fileId != null) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { drive.delete(fileId); }
        });
    }

    private Material get(Long groupId, Long id) {
        return materials.findById(id).filter(m -> m.getGroup().getId().equals(groupId)).orElseThrow(() -> new NotFoundException("Material not found"));
    }
    private MaterialResponse response(Material m) {
        return new MaterialResponse(m.getId(), m.getGroup().getId(), m.getTitle(), m.getDescription(), m.getType(),
                m.getExternalUrl(), m.getDriveFileId() != null, m.getFileName(), m.getFileSize(),
                m.getAuthor().getFirstName() + " " + m.getAuthor().getLastName(), m.getCreatedAt());
    }
}
