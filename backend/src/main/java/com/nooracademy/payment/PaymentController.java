package com.nooracademy.payment;

import com.nooracademy.security.CurrentUser;
import com.nooracademy.storage.R2Storage;
import com.nooracademy.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController @RequestMapping("/api/payments") @RequiredArgsConstructor
public class PaymentController {
    private final PaymentSettingsService settings;
    private final PaymentReceiptService receipts;
    @GetMapping("/settings") public PaymentSettingsService.Response settings() { return settings.get(); }
    @PutMapping("/settings") @PreAuthorize("hasRole('ADMIN')")
    public PaymentSettingsService.Response update(@Valid @RequestBody PaymentSettingsRequest request) { return settings.update(request); }
    @GetMapping("/receipts") @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentReceiptService.Response> all() { return receipts.all(); }
    @GetMapping("/enrollments/{id}/receipt") @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<PaymentReceiptService.Response> receipt(@PathVariable Long id, @CurrentUser User actor) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(receipts.receipt(id, actor));
    }
    @PostMapping(value = "/enrollments/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasRole('STUDENT')")
    public PaymentReceiptService.Response upload(@PathVariable Long id, @CurrentUser User actor, @RequestPart("file") MultipartFile file) {
        return receipts.upload(id, actor, file);
    }
    @GetMapping("/enrollments/{id}/receipt/download") @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<R2Storage.DownloadLink> download(@PathVariable Long id, @CurrentUser User actor) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(receipts.download(id, actor));
    }
}
