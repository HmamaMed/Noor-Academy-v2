package com.nooracademy.course;

import com.nooracademy.common.exception.*;
import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.storage.R2Storage;
import org.junit.jupiter.api.*;
import org.mapstruct.factory.Mappers;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.support.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CourseImageServiceTests {
    CourseRepository repository;
    R2Storage storage;
    CourseService service;
    Course course;
    final CourseRequest request = new CourseRequest("Learning", "Description", "Syllabus", null, null);
    @BeforeEach void prepare() {
        repository = mock(CourseRepository.class); storage = mock(R2Storage.class);
        service = new CourseService(repository, Mappers.getMapper(CourseMapper.class), storage);
        course = Course.builder().id(1L).title("Existing").imageKey("course-images/old").imageContentType("image/png").build();
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(course));
        when(repository.findById(1L)).thenReturn(Optional.of(course));
        when(repository.saveAndFlush(any())).thenAnswer(call -> { Course c = call.getArgument(0); if (c.getId() == null) c.setId(1L); return c; });
        when(storage.enabled()).thenReturn(true);
        when(storage.uploadCourseImage(any(), eq("image/png"))).thenReturn("course-images/new");
        TransactionSynchronizationManager.initSynchronization();
    }
    @AfterEach void clear() { TransactionSynchronizationManager.clearSynchronization(); }
    void commit() {
        var synchronizations = TransactionSynchronizationManager.getSynchronizations();
        synchronizations.forEach(TransactionSynchronization::afterCommit);
        synchronizations.forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
    }
    @Test void createStoresKeyAndReturnsStableApiPath() throws Exception {
        var response = service.create(request, CourseImageValidationTests.image("png", 8, 8));
        assertEquals("/api/courses/1/image?v=new", response.imageUrl());
        verify(storage).uploadCourseImage(any(), eq("image/png")); commit(); verify(storage, never()).delete(any());
    }
    @Test void replacementDeletesOldImageOnlyAfterCommit() throws Exception {
        service.update(1L, request, CourseImageValidationTests.image("png", 8, 8), false);
        verify(storage, never()).delete(any()); commit();
        verify(storage).delete("course-images/old"); verify(storage, never()).delete("course-images/new");
    }
    @Test void failedPersistenceCleansNewUploadAndRetainsOldImage() throws Exception {
        doThrow(new DataIntegrityViolationException("failed")).when(repository).saveAndFlush(any());
        assertThrows(DataIntegrityViolationException.class, () -> service.update(1L, request, CourseImageValidationTests.image("png", 8, 8), false));
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        verify(storage).delete("course-images/new"); verify(storage, never()).delete("course-images/old");
    }
    @Test void jsonUpdatePreservesImageWhileExplicitRemoveClearsMetadata() {
        assertNotNull(service.update(1L, request).imageUrl()); verifyNoInteractions(storage);
        assertNull(service.update(1L, request, null, true).imageUrl()); assertNull(course.getImageContentType());
        verify(storage, never()).delete(any()); commit(); verify(storage).delete("course-images/old");
    }
    @Test void storageDisabledAllowsTextOnlyButNotImageUpload() throws Exception {
        when(storage.enabled()).thenReturn(false); assertNull(service.create(request).imageUrl());
        assertThrows(BadRequestException.class, () -> service.create(request, CourseImageValidationTests.image("png", 8, 8)));
        verify(storage, never()).uploadCourseImage(any(), any());
    }
    @Test void blockedCourseDeletionRetainsImage() {
        doThrow(new DataIntegrityViolationException("used by group")).when(repository).flush();
        assertThrows(DataIntegrityViolationException.class, () -> service.delete(1L));
        assertTrue(TransactionSynchronizationManager.getSynchronizations().isEmpty()); verifyNoInteractions(storage);
    }
    @Test void successfulCourseDeletionRemovesImageAfterCommit() {
        service.delete(1L);
        verify(storage, never()).delete(any());
        commit();
        verify(storage).delete("course-images/old");
    }
    @Test void publicImageRequiresACoverAndSignsOnlyTheStoredKey() {
        when(storage.courseImage("course-images/old", "image/png")).thenReturn(new R2Storage.DownloadLink("https://example.test/signed", java.time.Instant.now()));
        assertEquals("https://example.test/signed", service.image(1L).url()); course.setImageKey(null);
        assertThrows(NotFoundException.class, () -> service.image(1L));
    }
}
