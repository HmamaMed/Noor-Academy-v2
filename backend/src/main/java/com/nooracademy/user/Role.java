package com.nooracademy.user;

public enum Role {
    ADMIN,
    SUPER_ADMIN,
    TEACHER,
    STUDENT;

    public boolean isAdmin() { return this == ADMIN || this == SUPER_ADMIN; }
}
