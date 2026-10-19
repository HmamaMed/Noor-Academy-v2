package com.nooracademy.contact;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "contact_messages")
@Getter @Setter @NoArgsConstructor
public class ContactMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, length = 254)
    private String email;
    @Column(nullable = false, length = 160)
    private String subject;
    @Column(nullable = false, length = 5000)
    private String message;
    @Column(name = "is_read", nullable = false)
    private boolean read;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
