// src/services/mailer.ts
export async function sendEmail(to: string, subject: string, html: string) {
  // Plug in nodemailer/Resend/SES/etc. For now, log:
  console.log("[MAIL->%s] %s\n%s", to, subject, html);
}
