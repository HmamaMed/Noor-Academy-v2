package com.nooracademy.auth;
import com.nooracademy.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name = "password_resets") @Getter @Setter @NoArgsConstructor
public class PasswordReset {
    @Id @Column(length = 64) private String tokenHash;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false) private Instant expiresAt;
}
