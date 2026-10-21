package com.nooracademy.payment;

import com.nooracademy.enrollment.Enrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "payment_receipts") @Getter @Setter @NoArgsConstructor
public class PaymentReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true) private Enrollment enrollment;
    @Column(nullable = false) private String storageKey;
    @Column(nullable = false, length = 200) private String fileName;
    @Column(nullable = false) private Long fileSize;
    @Column(nullable = false) private Instant uploadedAt;
}
