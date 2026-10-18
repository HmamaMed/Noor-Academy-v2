package com.nooracademy.user;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.common.exception.ConflictException;
import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.security.UserPrincipal;
import com.nooracademy.user.dto.CreateUserRequest;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SuperAdminTests {
    final UserRepository repository = mock(UserRepository.class);
    final PasswordEncoder encoder = mock(PasswordEncoder.class);
    final UserService users = new UserService(repository, Mappers.getMapper(UserMapper.class), encoder);

    User user(Role role) {
        return User.builder().id(1L).firstName("Owner").lastName("Account").email("owner@example.test").role(role).build();
    }

    @Test void protectedAccountIsNeverPassedToTheDeleteRepository() {
        when(repository.findLockedById(1L)).thenReturn(Optional.of(user(Role.SUPER_ADMIN)));
        assertThrows(ConflictException.class, () -> users.deleteUser(1L));
        verify(repository, never()).delete(any(User.class));
        verify(repository, never()).deleteById(any());
        verify(repository, never()).flush();
    }
    @Test void ordinaryAccountsRemainDeletableAndMissingUsersReturnNotFound() {
        var account = user(Role.ADMIN);
        when(repository.findLockedById(1L)).thenReturn(Optional.of(account));
        users.deleteUser(1L);
        verify(repository).delete(account); verify(repository).flush();
        assertThrows(NotFoundException.class, () -> users.deleteUser(2L));
    }
    @Test void normalAccountCreationCannotGrantSuperAdminEvenWithTamperedJson() {
        var request = new CreateUserRequest("Owner", "Account", "owner@example.test", "password123", "", Role.SUPER_ADMIN);
        assertThrows(BadRequestException.class, () -> users.createUser(request));
        verifyNoInteractions(repository, encoder);
    }
    @Test void administratorFilterIncludesProtectedAccountWithoutChangingItsStoredRole() {
        when(repository.findAll()).thenReturn(List.of(user(Role.SUPER_ADMIN), user(Role.TEACHER)));
        var admins = users.findAll(Role.ADMIN);
        assertEquals(1, admins.size()); assertEquals(Role.SUPER_ADMIN, admins.getFirst().role());
        assertTrue(Role.SUPER_ADMIN.isAdmin()); assertTrue(Role.ADMIN.isAdmin());
        assertFalse(Role.TEACHER.isAdmin()); assertFalse(Role.STUDENT.isAdmin());
    }
    @Test void protectedPrincipalReceivesAdministratorAuthorityAndKeepsItsIdentity() {
        var principal = new UserPrincipal(user(Role.SUPER_ADMIN));
        var granted = principal.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        assertTrue(granted.contains("ROLE_ADMIN")); assertTrue(granted.contains("ROLE_SUPER_ADMIN"));
        assertEquals(Role.SUPER_ADMIN, principal.getUser().getRole());
        assertEquals(List.of("ROLE_STUDENT"), new UserPrincipal(user(Role.STUDENT)).getAuthorities().stream().map(a -> a.getAuthority()).toList());
    }
}
