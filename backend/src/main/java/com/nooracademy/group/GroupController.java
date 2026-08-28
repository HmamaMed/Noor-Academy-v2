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
    public List<GroupResponse> findAll(@RequestParam(required = false) Long teacherId) {
        return teacherId == null ? groupService.findAll() : groupService.findByTeacher(teacherId);
    }

    @GetMapping("/{id}")
    public GroupResponse findById(@PathVariable Long id) {
        return groupService.findById(id);
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
