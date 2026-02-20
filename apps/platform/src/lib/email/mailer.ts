import nodemailer from "nodemailer";

/**
 * Nodemailer transporter using Resend SMTP.
 * Resend SMTP: smtp.resend.com:587, user=resend, pass=API_KEY
 */
export function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY!,
    },
  });
}

export const FROM_ADDRESS = "CommitCamp <noreply@commitcamp.com>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
