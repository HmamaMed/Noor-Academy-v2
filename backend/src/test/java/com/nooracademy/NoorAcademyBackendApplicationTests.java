package com.nooracademy;

import com.nooracademy.auth.*;
import com.nooracademy.auth.dto.LoginRequest;
import com.nooracademy.course.*;
import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.enrollment.*;
import com.nooracademy.group.*;
import com.nooracademy.group.dto.*;
import com.nooracademy.session.dto.SessionRequest;
import com.nooracademy.room.*;
import com.nooracademy.room.dto.RoomRequest;
import com.nooracademy.user.*;
import com.nooracademy.user.dto.CreateUserRequest;
import com.nooracademy.notification.*;
import com.nooracademy.storage.R2Storage;
import com.nooracademy.material.MaterialRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(NoorAcademyBackendApplicationTests.EventConfig.class)
class NoorAcademyBackendApplicationTests {
    @Container static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.show-sql", () -> "false");
    }
    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired AuthService auth;
    @Autowired CourseService courses;
    @Autowired RoomService rooms;
    @Autowired GroupService groups;
    @Autowired EnrollmentService enrollments;
    @Autowired Recorder recorder;
    @MockitoBean R2Storage r2;
    @MockitoSpyBean MaterialRepository materialRepository;
    @MockitoBean MailService mail;
    User teacher, otherTeacher, student, otherStudent;
    String adminToken, teacherToken, otherTeacherToken, studentToken, otherStudentToken;
    Long groupId, courseId, roomId;
    final String password = "StrongPassword123";

    @BeforeEach void prepare() {
        jdbc.execute("TRUNCATE materials, password_resets, enrollments, sessions, groups, rooms, courses, users RESTART IDENTITY CASCADE");
        recorder.events.clear();
        when(mail.enabled()).thenReturn(true);
        adminToken = token(create("admin", Role.ADMIN));
        teacher = create("teacher", Role.TEACHER); teacherToken = token(teacher);
        otherTeacher = create("otherteacher", Role.TEACHER); otherTeacherToken = token(otherTeacher);
        student = create("student", Role.STUDENT); studentToken = token(student);
        otherStudent = create("otherstudent", Role.STUDENT); otherStudentToken = token(otherStudent);
        courseId = courses.create(new CourseRequest("Arabic", "Learn Arabic", "Reading")).id();
        roomId = rooms.create(new RoomRequest("Room A", 1)).id();
        groupId = groups.create(request(roomId, teacher.getId(), LocalDate.now().plusDays(1), LocalDate.now().plusDays(30))).id();
        groups.updateStatus(groupId, new GroupStatusUpdateRequest(GroupStatus.ACTIVE));
    }
    User create(String name, Role role) {
        Long id = users.createUser(new CreateUserRequest(name, "User", name + "@example.test", password, "", role)).id();
        return userRepository.findById(id).orElseThrow();
    }
    String token(User user) { return auth.login(new LoginRequest(user.getEmail(), password)).token(); }
    GroupRequest request(Long room, Long teacherId, LocalDate start, LocalDate end) {
        return new GroupRequest(courseId, teacherId, room, "Arabic group", start, end,
                List.of(new SessionRequest(DayOfWeek.MONDAY, LocalTime.of(10,0), LocalTime.of(11,0))));
    }
    HttpResponse<String> api(String method, String path, String token, Object body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api" + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        builder.header("Content-Type", "application/json");
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        return HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
    HttpResponse<String> material(String token, boolean file) throws Exception {
        String payload = "--noor\r\nContent-Disposition: form-data; name=\"metadata\"\r\nContent-Type: application/json\r\n\r\n"
            + "{\"title\":\"Lesson 1\",\"description\":\"Read pages 1–3\",\"type\":\"LESSON\",\"externalUrl\":\"https://drive.google.com/file/d/example/view\"}\r\n";
        if (file) payload += "--noor\r\nContent-Disposition: form-data; name=\"file\"; filename=\"lesson.pdf\"\r\nContent-Type: application/pdf\r\n\r\nPDF content\r\n";
        payload += "--noor--\r\n";
        var request = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/workspaces/"+groupId+"/materials"))
            .header("Authorization", "Bearer " + token).header("Content-Type", "multipart/form-data; boundary=noor")
            .POST(HttpRequest.BodyPublishers.ofString(payload)).build();
        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }
    long id(HttpResponse<String> response) { return ((Number) json.readValue(response.body(), Map.class).get("id")).longValue(); }

    @Test void adminCanCreateTeacherButStudentCannot() throws Exception {
        var body = Map.of("firstName","New","lastName","Teacher","email","new@example.test","password",password,"role","TEACHER");
        assertEquals(200, api("POST","/users",adminToken,body).statusCode());
        assertEquals(403, api("POST","/users",studentToken,body).statusCode());
    }
    @Test void groupsAndEnrollmentsMapLazyRelationsAndIncludeSchedule() throws Exception {
        enrollments.apply(student,groupId);
        assertEquals(200, api("GET","/groups",teacherToken,null).statusCode());
        var response = api("GET","/enrollments/me",studentToken,null);
        assertEquals(200,response.statusCode()); assertTrue(response.body().contains("MONDAY"));
    }
    @Test void teachersCannotReadOtherRostersOrPendingStudents() throws Exception {
        enrollments.apply(student,groupId);
        assertEquals(403, api("GET","/enrollments?groupId="+groupId,otherTeacherToken,null).statusCode());
        assertEquals("[]",api("GET","/enrollments?groupId="+groupId,teacherToken,null).body());
        assertEquals(403, api("GET","/groups?teacherId="+teacher.getId(),otherTeacherToken,null).statusCode());
    }
    @Test void cancelledEnrollmentCanBeReusedWithoutUniqueConstraintFailure() {
        var original = enrollments.apply(student,groupId);
        enrollments.cancel(original.id(),student);
        var renewed = enrollments.apply(student,groupId);
        assertEquals(original.id(),renewed.id()); assertEquals(EnrollmentStatus.PENDING,renewed.status()); assertNull(renewed.confirmedAt());
    }
    @Test void onlyActiveUnexpiredGroupsAcceptApplications() {
        for (GroupStatus status : List.of(GroupStatus.DRAFT,GroupStatus.FULL,GroupStatus.COMPLETED,GroupStatus.CANCELLED)) {
            groups.updateStatus(groupId,new GroupStatusUpdateRequest(status));
            assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> enrollments.apply(student,groupId));
        }
        groups.updateStatus(groupId,new GroupStatusUpdateRequest(GroupStatus.ACTIVE));
        jdbc.update("update groups set end_date = ? where id = ?", LocalDate.now().minusDays(1),groupId);
        assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> enrollments.apply(student,groupId));
    }
    @Test void expiredApplicationCannotBeConfirmedAndSchedulerCancelsIt() {
        var application = enrollments.apply(student,groupId);
        jdbc.update("update enrollments set applied_at = ? where id = ?", java.sql.Timestamp.from(Instant.now().minusSeconds(73*3600)),application.id());
        assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> enrollments.confirm(application.id()));
        enrollments.autoCancelExpiredApplications();
        assertEquals(EnrollmentStatus.CANCELLED,enrollments.findMine(student.getId()).getFirst().status());
    }
    @Test void simultaneousConfirmationsCannotOverbook() throws Exception {
        var first=enrollments.apply(student,groupId); var second=enrollments.apply(otherStudent,groupId);
        try (ExecutorService executor=Executors.newFixedThreadPool(2)) {
            var gate=new CountDownLatch(1);
            Callable<Boolean> one=() -> { gate.await(); try { enrollments.confirm(first.id()); return true; } catch(com.nooracademy.common.exception.ConflictException ex) { return false; } };
            Callable<Boolean> two=() -> { gate.await(); try { enrollments.confirm(second.id()); return true; } catch(com.nooracademy.common.exception.ConflictException ex) { return false; } };
            var a=executor.submit(one); var b=executor.submit(two); gate.countDown();
            assertNotEquals(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));
        }
        assertEquals(1,groups.findById(groupId).confirmedSeats());
    }
    @Test void concurrentApplicationsForSameStudentProduceOneRecord() throws Exception {
        try (ExecutorService executor=Executors.newFixedThreadPool(2)) {
            var gate=new CountDownLatch(1);
            Callable<Boolean> task=() -> { gate.await(); try { enrollments.apply(student,groupId); return true; } catch(com.nooracademy.common.exception.BadRequestException ex) { return false; } };
            var a=executor.submit(task); var b=executor.submit(task); gate.countDown();
            assertNotEquals(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));
        }
        assertEquals(1,enrollments.findMine(student.getId()).size());
    }
    @Test void shrinkingRoomBelowConfirmedSeatsIsRejected() {
        rooms.update(roomId,new RoomRequest("Room A",2));
        enrollments.confirm(enrollments.apply(student,groupId).id()); enrollments.confirm(enrollments.apply(otherStudent,groupId).id());
        assertThrows(com.nooracademy.common.exception.ConflictException.class,() -> rooms.update(roomId,new RoomRequest("Room A",1)));
    }
    @Test void schedulingChecksRoomTeacherDatesAndSubmittedOverlaps() {
        var otherRoom=rooms.create(new RoomRequest("Room B",5)).id();
        assertThrows(com.nooracademy.common.exception.ConflictException.class,() -> groups.create(request(otherRoom,teacher.getId(),LocalDate.now().plusDays(1),LocalDate.now().plusDays(30))));
        assertThrows(com.nooracademy.common.exception.ConflictException.class,() -> groups.create(request(roomId,otherTeacher.getId(),LocalDate.now().plusDays(1),LocalDate.now().plusDays(30))));
        assertDoesNotThrow(() -> groups.create(request(roomId,teacher.getId(),LocalDate.now().plusDays(31),LocalDate.now().plusDays(60))));
        var overlapping = new GroupRequest(courseId,otherTeacher.getId(),otherRoom,"Bad",LocalDate.now(),LocalDate.now().plusDays(5),List.of(
            new SessionRequest(DayOfWeek.TUESDAY,LocalTime.of(10,0),LocalTime.of(12,0)),new SessionRequest(DayOfWeek.TUESDAY,LocalTime.of(11,0),LocalTime.of(13,0))));
        assertThrows(com.nooracademy.common.exception.ConflictException.class,() -> groups.create(overlapping));
        assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> groups.create(request(otherRoom,otherTeacher.getId(),LocalDate.now().plusDays(5),LocalDate.now())));
    }
    @Test void terminalGroupsDoNotReserveRoomsButReactivationChecksConflicts() {
        groups.updateStatus(groupId,new GroupStatusUpdateRequest(GroupStatus.CANCELLED));
        assertDoesNotThrow(() -> groups.create(request(roomId,teacher.getId(),LocalDate.now().plusDays(1),LocalDate.now().plusDays(30))));
        assertThrows(com.nooracademy.common.exception.ConflictException.class,() -> groups.updateStatus(groupId,new GroupStatusUpdateRequest(GroupStatus.ACTIVE)));
    }
    @Test void draftGroupsAreHiddenFromVisitors() throws Exception {
        groups.updateStatus(groupId,new GroupStatusUpdateRequest(GroupStatus.DRAFT));
        assertEquals("[]",api("GET","/groups",null,null).body());
        assertEquals(404,api("GET","/groups/"+groupId,null,null).statusCode());
        assertEquals(200,api("GET","/groups/"+groupId,teacherToken,null).statusCode());
    }
    @Test void workspaceRequiresConfirmedEnrollmentOrAssignedTeacher() throws Exception {
        assertEquals(401,api("GET","/workspaces/"+groupId,null,null).statusCode());
        assertEquals(403,api("GET","/workspaces/"+groupId,studentToken,null).statusCode());
        var enrollment = enrollments.apply(student,groupId);
        assertEquals(403,api("GET","/workspaces/"+groupId,studentToken,null).statusCode());
        enrollments.confirm(enrollment.id());
        assertEquals(200,api("GET","/workspaces/"+groupId,studentToken,null).statusCode());
        assertEquals(403,api("GET","/workspaces/"+groupId,otherTeacherToken,null).statusCode());
        assertEquals(403,material(studentToken,false).statusCode());
        enrollments.cancel(enrollment.id(),student);
        assertEquals(403,api("GET","/workspaces/"+groupId,studentToken,null).statusCode());
    }
    @Test void teacherCanShareLinksAndOnlyManagersCanRemoveThem() throws Exception {
        var created=material(teacherToken,false); assertEquals(201,created.statusCode(),created.body());
        var application=enrollments.apply(student,groupId); enrollments.confirm(application.id());
        var space=api("GET","/workspaces/"+groupId,studentToken,null);
        assertTrue(space.body().contains("Lesson 1")); assertTrue(space.body().contains("\"canManage\":false"));
        assertEquals(403,api("DELETE","/workspaces/"+groupId+"/materials/"+id(created),studentToken,null).statusCode());
        assertEquals(204,api("DELETE","/workspaces/"+groupId+"/materials/"+id(created),teacherToken,null).statusCode());
    }
    @Test void r2LinksRequireConfirmedEnrollmentAndRemainAvailableForCompletedGroups() throws Exception {
        when(r2.upload(anyString(),any())).thenReturn("materials/private-key");
        when(r2.download("materials/private-key","lesson.pdf"))
                .thenReturn(new R2Storage.DownloadLink("https://test.r2.cloudflarestorage.com/private?signature=test",Instant.now().plusSeconds(300)));
        assertEquals(403,material(otherTeacherToken,true).statusCode());
        verify(r2,never()).upload(anyString(),any());
        var created=material(teacherToken,true); assertEquals(201,created.statusCode(),created.body());
        long materialId=id(created);
        assertEquals("materials/private-key",jdbc.queryForObject("SELECT storage_key FROM materials WHERE id=?",String.class,materialId));
        String path="/workspaces/"+groupId+"/materials/"+materialId+"/download";
        assertEquals(401,api("GET",path,null,null).statusCode());
        assertEquals(403,api("GET",path,studentToken,null).statusCode());
        var enrollment=enrollments.apply(student,groupId);
        assertEquals(403,api("GET",path,studentToken,null).statusCode());
        assertEquals(403,api("GET",path,otherStudentToken,null).statusCode());
        assertEquals(403,api("GET",path,otherTeacherToken,null).statusCode());
        verify(r2,never()).download(anyString(),anyString());
        enrollments.confirm(enrollment.id());
        var response=api("GET",path,studentToken,null);
        assertEquals(200,response.statusCode(),response.body());
        assertTrue(response.body().contains("signature=test"));
        assertEquals("private, no-store",response.headers().firstValue("Cache-Control").orElseThrow());
        groups.updateStatus(groupId,new GroupStatusUpdateRequest(GroupStatus.COMPLETED));
        assertEquals(200,api("GET",path,studentToken,null).statusCode());
        assertEquals(204,api("DELETE","/workspaces/"+groupId+"/materials/"+materialId,teacherToken,null).statusCode());
        verify(r2).delete("materials/private-key");
    }
    @Test void r2UploadIsRemovedWhenDatabaseTransactionRollsBack() throws Exception {
        when(r2.upload(anyString(),any())).thenReturn("materials/rollback-key");
        doThrow(new org.springframework.dao.DataIntegrityViolationException("simulated database failure"))
                .when(materialRepository).saveAndFlush(any());
        assertEquals(409,material(teacherToken,true).statusCode());
        assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM materials",Integer.class));
        verify(r2).delete("materials/rollback-key");
    }
    @Test void optionalUnconfiguredSmtpDoesNotBlockDeploymentHealth() throws Exception {
        // No SMTP server is running at localhost:587. PostgreSQL must still be checked.
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/actuator/health")).GET().build();
        var response=HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString());
        assertEquals(200,response.statusCode(),response.body());
        assertTrue(response.body().contains("\"status\":\"UP\""));
    }
    @Test void passwordResetIsSingleUseAndRevokesOldTokens() throws Exception {
        assertEquals(200,api("POST","/auth/forgot-password",null,Map.of("email",student.getEmail())).statusCode());
        var notification=recorder.events.stream().filter(e -> e.subject().startsWith("Reset")).findFirst().orElseThrow();
        String resetToken=notification.body().split("token=")[1].split("\n")[0];
        assertEquals(200,api("POST","/auth/reset-password",null,Map.of("token",resetToken,"password","NewPassword123")).statusCode());
        assertEquals(401,api("GET","/users/me",studentToken,null).statusCode());
        assertEquals(400,api("POST","/auth/reset-password",null,Map.of("token",resetToken,"password","AnotherPassword123")).statusCode());
        assertNotNull(auth.login(new LoginRequest(student.getEmail(),"NewPassword123")).token());
    }
    @Test void studentsCannotCancelSomeoneElsesApplication() throws Exception {
        var enrollment=enrollments.apply(student,groupId);
        assertEquals(403,api("PATCH","/enrollments/"+enrollment.id()+"/cancel",otherStudentToken,null).statusCode());
    }
    @Test void profileUpdatesWorkAndReferencedDeletesReturnConflict() throws Exception {
        assertEquals(200,api("PUT","/users/me",studentToken,Map.of("firstName","Updated","lastName","Name","phone","123")).statusCode());
        assertEquals("Updated",users.findById(student.getId()).firstName());
        enrollments.apply(student,groupId);
        assertEquals(409,api("DELETE","/groups/"+groupId,adminToken,null).statusCode());
    }
    @org.springframework.boot.test.context.TestConfiguration static class EventConfig { @Bean Recorder recorder() { return new Recorder(); } }
    static class Recorder {
        final List<MailNotification> events=new CopyOnWriteArrayList<>();
        @EventListener public void record(MailNotification event) { events.add(event); }
    }
}
