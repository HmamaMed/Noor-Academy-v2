package com.nooracademy.contact;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {
    private final ContactService contact;

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public void send(@Valid @RequestBody ContactRequest request) {
        contact.send(request);
    }

    @GetMapping("/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ContactService.Inbox inbox(@RequestParam(defaultValue = "0") int page) {
        return contact.inbox(page);
    }

    public record ReadRequest(boolean read) {}

    @PatchMapping("/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ContactMessage markRead(@PathVariable Long id, @RequestBody ReadRequest request) {
        return contact.markRead(id, request.read());
    }

    @GetMapping("/settings")
    public FooterSettings footer() {
        return contact.footer();
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public FooterSettings updateFooter(@Valid @RequestBody FooterSettingsRequest request) {
        return contact.updateFooter(request);
    }
}
