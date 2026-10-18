package com.nooracademy.group;

import com.nooracademy.group.dto.GroupRequest;
import com.nooracademy.group.dto.GroupResponse;
import com.nooracademy.group.dto.GroupStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public List<GroupResponse> findAll(@RequestParam(required = false) Long teacherId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.nooracademy.security.UserPrincipal principal) {
        if (principal != null && principal.getUser().getRole().isAdmin()) {
            return teacherId == null ? groupService.findAll() : groupService.findByTeacher(teacherId);
        }
        if (principal != null && principal.getUser().getRole() == com.nooracademy.user.Role.TEACHER) {
            if (teacherId != null && !teacherId.equals(principal.getUser().getId())) throw new org.springframework.security.access.AccessDeniedException("Group is not assigned to you");
            return groupService.findByTeacher(principal.getUser().getId());
        }
        return groupService.findPublic();
    }

    @GetMapping("/{id}")
    public GroupResponse findById(@PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.nooracademy.security.UserPrincipal principal) {
        return groupService.findVisible(id, principal == null ? null : principal.getUser());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public GroupResponse create(@Valid @RequestBody GroupRequest request) {
        return groupService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public GroupResponse update(@PathVariable Long id, @Valid @RequestBody GroupRequest request) {
        return groupService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public GroupResponse updateStatus(@PathVariable Long id, @Valid @RequestBody GroupStatusUpdateRequest request) {
        return groupService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        groupService.delete(id);
    }
}
