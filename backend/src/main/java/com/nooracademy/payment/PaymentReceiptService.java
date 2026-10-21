package com.nooracademy.payment;

import com.nooracademy.common.exception.*;
import com.nooracademy.enrollment.*;
import com.nooracademy.group.GroupRepository;
import com.nooracademy.storage.R2Storage;
import com.nooracademy.user.User;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PaymentReceiptService {
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private final PaymentReceiptRepository receipts;
    private final EnrollmentRepository enrollments;
    private final GroupRepository groups;
    private final EnrollmentProperties properties;
    private final EntityManager entityManager;
    private final R2Storage storage;

    public record Response(Long enrollmentId, String fileName, Long fileSize, Instant uploadedAt) {}

    public Response receipt(Long enrollmentId, User actor) {
        accessible(enrollmentId, actor);
        return receipts.findByEnrollmentId(enrollmentId).map(this::response).orElse(null);
    }
    public List<Response> all() { return receipts.findAll().stream().map(this::response).toList(); }

    @Transactional public Response upload(Long enrollmentId, User actor, MultipartFile file) {
        var snapshot = accessible(enrollmentId, actor);
        groups.findLockedById(snapshot.getGroup().getId()).orElseThrow(() -> new NotFoundException("Group not found"));
        entityManager.refresh(snapshot);
        if (snapshot.getStatus() != EnrollmentStatus.PENDING || !snapshot.getAppliedAt()
                .plus(properties.pendingExpiryHours(), ChronoUnit.HOURS).isAfter(Instant.now())) {
            throw new BadRequestException("Receipts can only be uploaded for pending applications before their deadline.");
        }
        if (!storage.enabled()) throw new BadRequestException("Receipt uploads are unavailable. Please contact the academy or pay in person.");
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) throw new BadRequestException("Choose a PDF, JPG, or PNG receipt up to 5 MB.");
        byte[] bytes;
        try { bytes = file.getBytes(); } catch (IOException ex) { throw new BadRequestException("Could not read the receipt. Please try again."); }
        validateFile(bytes);
        String name = safeName(file.getOriginalFilename());
        var receipt = receipts.findByEnrollmentId(enrollmentId).orElseGet(PaymentReceipt::new);
        String previousKey = receipt.getStorageKey();
        String key = storage.uploadReceipt(name, bytes);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) { if (status != STATUS_COMMITTED) storage.delete(key); }
            @Override public void afterCommit() { if (previousKey != null) storage.delete(previousKey); }
        });
        receipt.setEnrollment(snapshot); receipt.setStorageKey(key); receipt.setFileName(name);
        receipt.setFileSize((long) bytes.length); receipt.setUploadedAt(Instant.now());
        return response(receipts.saveAndFlush(receipt));
    }

    public R2Storage.DownloadLink download(Long enrollmentId, User actor) {
        accessible(enrollmentId, actor);
        var receipt = receipts.findByEnrollmentId(enrollmentId).orElseThrow(() -> new NotFoundException("Receipt not found"));
        return storage.download(receipt.getStorageKey(), receipt.getFileName());
    }

    /** Called while the enrollment's group lock is held; old proof must not carry into a new application. */
    @Transactional public void clearForReapplication(Long enrollmentId) {
        receipts.findByEnrollmentId(enrollmentId).ifPresent(receipt -> {
            String key = receipt.getStorageKey(); receipts.delete(receipt); receipts.flush();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { storage.delete(key); }
            });
        });
    }

    private Enrollment accessible(Long id, User actor) {
        var enrollment = enrollments.findById(id).orElseThrow(() -> new NotFoundException("Application not found"));
        if (!actor.getRole().isAdmin() && !enrollment.getStudent().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the student and academy administrators can access this receipt.");
        }
        return enrollment;
    }
    private Response response(PaymentReceipt receipt) {
        return new Response(receipt.getEnrollment().getId(), receipt.getFileName(), receipt.getFileSize(), receipt.getUploadedAt());
    }
    static void validateFile(byte[] bytes) {
        boolean pdf = bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-';
        boolean jpg = bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255;
        byte[] png = {(byte)137,80,78,71,13,10,26,10};
        boolean isPng = bytes.length >= 8 && java.util.Arrays.equals(java.util.Arrays.copyOf(bytes, 8), png);
        if (!pdf && !jpg && !isPng) throw new BadRequestException("Choose a PDF, JPG, or PNG receipt. Renaming a different file does not change its type.");
    }
    static String safeName(String value) {
        String name = value == null ? "payment-receipt" : value.replaceAll("[\\\\/\\p{Cntrl}]", "_").strip();
        if (name.isBlank() || name.equals(".") || name.equals("..")) name = "payment-receipt";
        return name.length() > 200 ? name.substring(name.length() - 200) : name;
    }
}
