import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Reset your Media Tracker password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 16px;">Password Reset</h2>
          <p style="margin-bottom: 16px; color: #555;">
            You requested a password reset for your Media Tracker account.
          </p>
          <p style="margin-bottom: 24px; color: #555;">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Reset Password
          </a>
          <p style="margin-top: 24px; color: #999; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendLoginMethodLinkedEmail(
  to: string,
  googleEmail: string,
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "New sign-in method added to your Media Tracker account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 16px;">Sign-in method linked</h2>
          <p style="margin-bottom: 16px; color: #555;">
            The Google account <strong>${googleEmail}</strong> was just linked to
            your Media Tracker account. You can now sign in with Google.
          </p>
          <p style="margin-top: 24px; color: #999; font-size: 12px;">
            If you didn't do this, sign in with your password and change it
            immediately.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send sign-in method email:", error);
    return false;
  }
}
