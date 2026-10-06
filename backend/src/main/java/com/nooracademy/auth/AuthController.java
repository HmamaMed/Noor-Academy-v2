package com.nooracademy.auth;

import com.nooracademy.auth.dto.AuthResponse;
import com.nooracademy.auth.dto.LoginRequest;
import com.nooracademy.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public java.util.Map<String, String> forgotPassword(@Valid @RequestBody com.nooracademy.auth.dto.ForgotPasswordRequest request) {
        passwordResetService.request(request.email());
        return java.util.Map.of("message", "If this email is registered, a password reset link will be sent.");
    }

    @PostMapping("/reset-password")
    public java.util.Map<String, String> resetPassword(@Valid @RequestBody com.nooracademy.auth.dto.ResetPasswordRequest request) {
        passwordResetService.reset(request.token(), request.password());
        return java.util.Map.of("message", "Password updated. Please log in again.");
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
