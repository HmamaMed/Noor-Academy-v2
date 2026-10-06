package com.nooracademy.auth;
import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.notification.*;
import com.nooracademy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
@Service @RequiredArgsConstructor
public class PasswordResetService {
    private final PasswordResetRepository resets; private final UserRepository users;
    private final PasswordEncoder passwords; private final MailService mail;
    private final ApplicationEventPublisher events;
    @Value("${app.frontend-url:http://localhost:4200}") private String frontendUrl;
    @Transactional public void request(String email) {
        if (!mail.enabled()) throw new BadRequestException("Password recovery is not configured yet. Contact the academy administrator.");
        // Always return the same response for known and unknown addresses.
        users.findByEmail(email.trim()).ifPresent(user -> {
            users.findLockedById(user.getId()).orElseThrow();
            resets.deleteByUserId(user.getId()); resets.flush();
            byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            PasswordReset reset = new PasswordReset(); reset.setTokenHash(hash(token)); reset.setUser(user);
            reset.setExpiresAt(Instant.now().plusSeconds(1800)); resets.save(reset);
            events.publishEvent(new MailNotification(user.getEmail(), "Reset your Noor Academy password",
                "Open this link within 30 minutes to reset your password:\n" + frontendUrl + "/reset-password?token=" + token + "\nIf you did not request this, ignore this message."));
        });
    }
    @Transactional public void reset(String token, String password) {
        // Lock the user before the token so simultaneous requests/resets share the same lock order.
        String hashed = hash(token);
        Long userId = resets.findById(hashed).orElseThrow(() -> new BadRequestException("Reset link is invalid or expired")).getUser().getId();
        var user = users.findLockedById(userId).orElseThrow();
        var reset = resets.findLocked(hashed).orElseThrow(() -> new BadRequestException("Reset link is invalid or expired"));
        if (!reset.getExpiresAt().isAfter(Instant.now())) throw new BadRequestException("Reset link is invalid or expired");
        user.setPassword(passwords.encode(password)); user.setAuthVersion(user.getAuthVersion() + 1);
        resets.deleteByUserId(user.getId());
    }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3600000)
    @Transactional public void cleanup() { resets.deleteByExpiresAtBefore(Instant.now()); }
    static String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
