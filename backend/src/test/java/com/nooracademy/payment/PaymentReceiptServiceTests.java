package com.nooracademy.payment;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.enrollment.*;
import com.nooracademy.group.*;
import com.nooracademy.storage.R2Storage;
import com.nooracademy.user.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentReceiptServiceTests {
    PaymentReceiptRepository receipts;
    EnrollmentRepository enrollments;
    GroupRepository groups;
    EntityManager entityManager;
    R2Storage storage;
    PaymentReceiptService service;
    User student;
    Enrollment enrollment;
    MockMultipartFile file = new MockMultipartFile("file", "receipt.pdf", "application/pdf", "%PDF-receipt".getBytes(StandardCharsets.US_ASCII));

    @BeforeEach void prepare() {
        receipts = mock(PaymentReceiptRepository.class); enrollments = mock(EnrollmentRepository.class);
        groups = mock(GroupRepository.class); entityManager = mock(EntityManager.class); storage = mock(R2Storage.class);
        service = new PaymentReceiptService(receipts, enrollments, groups, new EnrollmentProperties(72), entityManager, storage);
        student = User.builder().id(4L).role(Role.STUDENT).build();
        Group group = Group.builder().id(8L).build();
        enrollment = Enrollment.builder().id(12L).student(student).group(group).status(EnrollmentStatus.PENDING).appliedAt(Instant.now()).build();
        when(enrollments.findById(12L)).thenReturn(Optional.of(enrollment));
        when(groups.findLockedById(8L)).thenReturn(Optional.of(group));
        when(receipts.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        when(storage.enabled()).thenReturn(true);
        when(storage.uploadReceipt(any(), any())).thenReturn("payment-receipts/new");
        TransactionSynchronizationManager.initSynchronization();
    }
    @AfterEach void clear() { TransactionSynchronizationManager.clearSynchronization(); }
    void commit() {
        var synchronizations = TransactionSynchronizationManager.getSynchronizations();
        synchronizations.forEach(TransactionSynchronization::afterCommit);
        synchronizations.forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
    }
    PaymentReceipt previous() {
        var receipt = new PaymentReceipt(); receipt.setEnrollment(enrollment); receipt.setStorageKey("payment-receipts/old");
        receipt.setFileName("previous.pdf"); receipt.setFileSize(20L); receipt.setUploadedAt(Instant.now());
        when(receipts.findByEnrollmentId(12L)).thenReturn(Optional.of(receipt)); return receipt;
    }
    @Test void anotherStudentCannotReadUploadOrDownloadAReceipt() {
        var stranger = User.builder().id(5L).role(Role.STUDENT).build();
        assertThrows(AccessDeniedException.class, () -> service.receipt(12L, stranger));
        assertThrows(AccessDeniedException.class, () -> service.upload(12L, stranger, file));
        assertThrows(AccessDeniedException.class, () -> service.download(12L, stranger));
        verifyNoInteractions(receipts, storage, groups);
    }
    @Test void ownerAndAdministratorCanDownloadOnlyTheStoredObject() {
        previous();
        var link = new R2Storage.DownloadLink("https://example.test/private", Instant.now().plusSeconds(300));
        when(storage.download("payment-receipts/old", "previous.pdf")).thenReturn(link);
        assertEquals(link, service.download(12L, student));
        assertEquals(link, service.download(12L, User.builder().id(99L).role(Role.ADMIN).build()));
    }
    @Test void uploadKeepsApplicationPendingAndDoesNotMoveItsDeadline() {
        Instant appliedAt = enrollment.getAppliedAt();
        var result = service.upload(12L, student, file);
        assertEquals(12L, result.enrollmentId()); assertEquals("receipt.pdf", result.fileName());
        assertEquals(file.getSize(), result.fileSize());
        assertEquals(EnrollmentStatus.PENDING, enrollment.getStatus()); assertEquals(appliedAt, enrollment.getAppliedAt());
        assertNull(enrollment.getConfirmedAt()); verify(entityManager).refresh(enrollment);
        verify(enrollments, never()).save(any()); commit(); verify(storage, never()).delete(any());
    }
    @Test void rejectsAnExpiredApplicationEvenBeforeTheSchedulerCancelsIt() {
        enrollment.setAppliedAt(Instant.now().minus(73, ChronoUnit.HOURS));
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, file));
        verifyNoInteractions(storage, receipts);
    }
    @Test void reloadsStatusUnderTheGroupLockBeforeAcceptingPaymentProof() {
        doAnswer(call -> { enrollment.setStatus(EnrollmentStatus.CANCELLED); return null; }).when(entityManager).refresh(enrollment);
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, file));
        var order = inOrder(groups, entityManager); order.verify(groups).findLockedById(8L); order.verify(entityManager).refresh(enrollment);
        verifyNoInteractions(storage, receipts);
    }
    @Test void unavailableStorageAndInvalidFilesNeverCreateReceiptRecords() {
        when(storage.enabled()).thenReturn(false);
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, file));
        when(storage.enabled()).thenReturn(true);
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, new MockMultipartFile("file", "receipt.pdf", "application/pdf", new byte[0])));
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, new MockMultipartFile("file", "receipt.pdf", "application/pdf", new byte[(int) PaymentReceiptService.MAX_BYTES + 1])));
        assertThrows(BadRequestException.class, () -> service.upload(12L, student, new MockMultipartFile("file", "receipt.pdf", "application/pdf", "<script>fake</script>".getBytes(StandardCharsets.UTF_8))));
        verify(storage, never()).uploadReceipt(any(), any()); verifyNoInteractions(receipts);
    }
    @Test void replacementKeepsTheOldFileUntilTheNewMetadataCommits() {
        previous(); service.upload(12L, student, file);
        verify(storage, never()).delete(any()); commit();
        verify(storage).delete("payment-receipts/old"); verify(storage, never()).delete("payment-receipts/new");
    }
    @Test void rollbackCleansTheNewFileAndKeepsThePreviousReceipt() {
        previous(); doThrow(new DataIntegrityViolationException("failed")).when(receipts).saveAndFlush(any());
        assertThrows(DataIntegrityViolationException.class, () -> service.upload(12L, student, file));
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        verify(storage).delete("payment-receipts/new"); verify(storage, never()).delete("payment-receipts/old");
    }
    @Test void reapplicationRemovesOldProofOnlyAfterCommit() {
        var receipt = previous(); service.clearForReapplication(12L);
        verify(receipts).delete(receipt); verify(receipts).flush(); verifyNoInteractions(storage);
        commit(); verify(storage).delete("payment-receipts/old");
    }
    @Test void signatureValidationAcceptsSupportedTypesAndSanitizesTheDownloadName() {
        assertDoesNotThrow(() -> PaymentReceiptService.validateFile(new byte[]{(byte) 255, (byte) 216, (byte) 255}));
        assertDoesNotThrow(() -> PaymentReceiptService.validateFile(new byte[]{(byte) 137, 80, 78, 71, 13, 10, 26, 10}));
        assertThrows(BadRequestException.class, () -> PaymentReceiptService.validateFile(new byte[]{1, 2, 3}));
        assertEquals("folder_receipt__.pdf", PaymentReceiptService.safeName("folder/receipt\r\n.pdf"));
        assertEquals("payment-receipt", PaymentReceiptService.safeName(".."));
        assertEquals(200, PaymentReceiptService.safeName("a".repeat(250) + ".pdf").length());
    }
}
