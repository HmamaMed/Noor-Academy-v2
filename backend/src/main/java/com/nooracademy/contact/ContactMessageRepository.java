package com.nooracademy.contact;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    long countByReadFalse();
    long countByEmailAndCreatedAtAfter(String email, Instant since);
}
