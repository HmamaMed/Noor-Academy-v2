package com.nooracademy.auth.dto;

import com.nooracademy.user.dto.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
