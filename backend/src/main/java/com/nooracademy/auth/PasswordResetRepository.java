package com.nooracademy.auth;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;
public interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PasswordReset r where r.tokenHash = :hash")
    Optional<PasswordReset> findLocked(@org.springframework.data.repository.query.Param("hash") String hash);
    void deleteByUserId(Long userId);
    void deleteByExpiresAtBefore(java.time.Instant cutoff);
}
