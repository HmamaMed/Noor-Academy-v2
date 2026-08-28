package com.nooracademy.user;

import com.nooracademy.security.CurrentUser;
import com.nooracademy.user.dto.UpdateUserRequest;
import com.nooracademy.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> findAll(@RequestParam(required = false) Role role) {
        return userService.findAll(role);
    }

    @GetMapping("/me")
    public UserResponse me(@CurrentUser User currentUser) {
        return userService.findById(currentUser.getId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PutMapping("/me")
    public UserResponse updateMe(@CurrentUser User currentUser, @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(currentUser.getId(), request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
