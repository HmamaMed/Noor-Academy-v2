package com.nooracademy.notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.*;
@Service @RequiredArgsConstructor @Slf4j
public class MailService {
    private final JavaMailSender sender;
    @Value("${app.mail.enabled:false}") private boolean enabled;
    @Value("${app.mail.from:no-reply@noor.academy}") private String from;
    public boolean enabled() { return enabled; }
    @Async @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void deliver(MailNotification notification) {
        if (!enabled) return;
        try {
            var mail = new SimpleMailMessage();
            mail.setFrom(from); mail.setTo(notification.recipient()); mail.setSubject(notification.subject()); mail.setText(notification.body());
            sender.send(mail);
        } catch (RuntimeException ex) { log.warn("Notification delivery failed ({})", ex.getClass().getSimpleName()); }
    }
}
