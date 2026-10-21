package com.nooracademy.course;

import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.course.dto.CourseResponse;
import com.nooracademy.storage.R2Storage;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Method security is exercised in a small Spring context, without an HTTP server or database. */
class CourseImageAccessTests {
    AnnotationConfigApplicationContext context;
    CourseController controller;
    CourseService service;
    final CourseRequest metadata = new CourseRequest("Science", "Learn", "Discover", null, null);
    final MockMultipartFile image = new MockMultipartFile("image", "cover.png", "image/png", new byte[]{1});
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean CourseService service() { return mock(CourseService.class); }
        @Bean CourseController controller(CourseService service) { return new CourseController(service); }
    }
    @BeforeEach void prepare() {
        context = new AnnotationConfigApplicationContext(Config.class);
        controller = context.getBean(CourseController.class); service = context.getBean(CourseService.class);
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); context.close(); }
    @Test void onlyAdministratorsCanCreateReplaceRemoveOrInspectUploadSettings() {
        for (String role : new String[]{"STUDENT", "TEACHER"}) {
            SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("actor", "", "ROLE_" + role));
            assertThrows(AccessDeniedException.class, () -> controller.createWithImage(metadata, image));
            assertThrows(AccessDeniedException.class, () -> controller.updateWithImage(1L, metadata, image, false));
            assertThrows(AccessDeniedException.class, () -> controller.updateWithImage(1L, metadata, null, true));
            assertThrows(AccessDeniedException.class, () -> controller.imageSettings());
        }
        verifyNoInteractions(service);
    }
    @Test void protectedAdministratorHasTheSameAdminEndpointAccess() {
        var account = com.nooracademy.user.User.builder().role(com.nooracademy.user.Role.SUPER_ADMIN).build();
        var principal = new com.nooracademy.security.UserPrincipal(account);
        SecurityContextHolder.getContext().setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, "", principal.getAuthorities()));
        controller.createWithImage(metadata, image);
        controller.imageSettings();
        verify(service).create(metadata, image);
        verify(service).imageUploadsEnabled();
    }
    @Test void administratorCanSaveImageAndPublicVisitorsCanLoadTheCover() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("admin", "", "ROLE_ADMIN"));
        var saved = new CourseResponse(1L, "Science", "Learn", "Discover", "/api/courses/1/image?v=new", null, null);
        when(service.create(metadata, image)).thenReturn(saved);
        assertEquals(saved, controller.createWithImage(metadata, image));
        SecurityContextHolder.clearContext();
        when(service.image(1L)).thenReturn(new R2Storage.DownloadLink("https://test.r2.cloudflarestorage.com/signed-cover", Instant.now().plusSeconds(300)));
        var result = controller.image(1L);
        assertEquals(302, result.getStatusCode().value());
        assertEquals("https://test.r2.cloudflarestorage.com/signed-cover", result.getHeaders().getLocation().toString());
        assertEquals("no-store", result.getHeaders().getCacheControl());
    }
}
