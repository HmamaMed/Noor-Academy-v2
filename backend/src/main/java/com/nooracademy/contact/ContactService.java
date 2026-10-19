package com.nooracademy.contact;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ContactService {
    private final ContactMessageRepository messages;
    private final FooterSettingsRepository settings;

    public record Inbox(List<ContactMessage> content, long totalElements, int totalPages, long unreadCount) {}

    @Transactional
    public void send(ContactRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (messages.countByEmailAndCreatedAtAfter(email, Instant.now().minus(10, ChronoUnit.MINUTES)) >= 3) {
            throw new BadRequestException("You've sent several messages. Please wait a few minutes before sending another.");
        }
        var message = new ContactMessage();
        message.setName(request.name().trim());
        message.setEmail(email);
        message.setSubject(request.subject().trim());
        message.setMessage(request.message().trim());
        message.setCreatedAt(Instant.now());
        messages.save(message);
    }

    @Transactional(readOnly = true)
    public Inbox inbox(int page) {
        var result = messages.findAll(PageRequest.of(Math.max(0, page), 20,
                Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return new Inbox(result.getContent(), result.getTotalElements(), result.getTotalPages(), messages.countByReadFalse());
    }

    @Transactional
    public ContactMessage markRead(Long id, boolean read) {
        var message = messages.findById(id).orElseThrow(() -> new NotFoundException("Message not found"));
        message.setRead(read);
        return message;
    }

    @Transactional(readOnly = true)
    public FooterSettings footer() {
        return settings.findById(1L).orElseThrow(() -> new NotFoundException("Footer settings not found"));
    }

    @Transactional
    public FooterSettings updateFooter(FooterSettingsRequest request) {
        var footer = footer();
        footer.setEmail(request.email().trim());
        footer.setPhone(request.phone().trim());
        footer.setInstagramUrl(request.instagramUrl().trim());
        footer.setFacebookUrl(request.facebookUrl().trim());
        footer.setWhatsappUrl(request.whatsappUrl().trim());
        footer.setLocationName(request.locationName().trim());
        footer.setAddress(request.address().trim());
        footer.setLatitude(request.latitude());
        footer.setLongitude(request.longitude());
        return footer;
    }
}
