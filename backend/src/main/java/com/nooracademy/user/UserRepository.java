package com.nooracademy.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from User e where e.id = :id")
    java.util.Optional<User> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
