package com.nooracademy.user.dto;

import com.nooracademy.user.Role;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        Role role
) {
}
