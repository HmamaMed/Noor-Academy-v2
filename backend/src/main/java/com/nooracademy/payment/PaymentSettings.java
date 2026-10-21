package com.nooracademy.payment;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "payment_settings") @Getter @Setter @NoArgsConstructor
public class PaymentSettings {
    @Id private Long id;
    @Column(nullable = false, length = 160) private String bankName = "";
    @Column(nullable = false, length = 160) private String accountHolder = "";
    @Column(nullable = false, length = 80) private String rib = "";
    @Column(nullable = false, length = 1000) private String bankInstructions = "";
    @Column(nullable = false, length = 1000) private String visitInstructions = "";
    @Column(nullable = false, length = 300) private String openingHours = "";
}
