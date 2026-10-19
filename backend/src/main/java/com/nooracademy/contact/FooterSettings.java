package com.nooracademy.contact;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "footer_settings")
@Getter @Setter @NoArgsConstructor
public class FooterSettings {
    @Id
    private Long id;
    @Column(nullable = false, length = 254)
    private String email = "";
    @Column(nullable = false, length = 40)
    private String phone = "";
    @Column(nullable = false, length = 500)
    private String instagramUrl = "";
    @Column(nullable = false, length = 500)
    private String facebookUrl = "";
    @Column(nullable = false, length = 500)
    private String whatsappUrl = "";
    @Column(nullable = false, length = 160)
    private String locationName = "";
    @Column(nullable = false, length = 300)
    private String address = "";
    private Double latitude;
    private Double longitude;
}
