package com.nooracademy.material;

import com.nooracademy.group.Group;
import com.nooracademy.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "materials")
@Getter @Setter @NoArgsConstructor
public class Material {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "group_id") private Group group;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "author_id") private User author;
    @Column(nullable = false, length = 200) private String title;
    @Column(columnDefinition = "text") private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private MaterialType type;
    @Column(name = "external_url", length = 2000) private String externalUrl;
    @Column(name = "storage_key", length = 1024) private String storageKey;
    @Column(name = "file_name") private String fileName;
    @Column(name = "file_size") private Long fileSize;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
