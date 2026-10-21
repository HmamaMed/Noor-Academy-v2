package com.nooracademy.payment;

import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.storage.R2Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PaymentSettingsService {
    private final PaymentSettingsRepository settings;
    private final R2Storage storage;
    public record Response(String bankName, String accountHolder, String rib, String bankInstructions,
                           String visitInstructions, String openingHours, boolean receiptUploadsEnabled, long maxReceiptBytes) {}
    public Response get() { return response(record()); }
    @Transactional public Response update(PaymentSettingsRequest request) {
        var settings = record();
        settings.setBankName(request.bankName().trim()); settings.setAccountHolder(request.accountHolder().trim());
        settings.setRib(request.rib().trim()); settings.setBankInstructions(request.bankInstructions().trim());
        settings.setVisitInstructions(request.visitInstructions().trim()); settings.setOpeningHours(request.openingHours().trim());
        return response(settings);
    }
    private PaymentSettings record() { return settings.findById(1L).orElseThrow(() -> new NotFoundException("Payment settings not found")); }
    private Response response(PaymentSettings settings) {
        return new Response(settings.getBankName(), settings.getAccountHolder(), settings.getRib(), settings.getBankInstructions(),
                settings.getVisitInstructions(), settings.getOpeningHours(), storage.enabled(), PaymentReceiptService.MAX_BYTES);
    }
}
