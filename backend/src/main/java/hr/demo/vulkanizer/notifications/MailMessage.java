package hr.demo.vulkanizer.notifications;

/** Jedna odlazna poruka. Primatelj je parametar — ništa u sastavljanju ne zna za servis. */
record MailMessage(String to, String subject, String body) {
}
