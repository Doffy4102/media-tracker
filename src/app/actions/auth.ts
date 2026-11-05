"use server";

import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { sendPasswordResetEmail } from "@/lib/email";
import { throttle, type ThrottleOutcome } from "@/lib/attempt-throttle";
import { redirect } from "next/navigation";

function throttleMessage(outcome: ThrottleOutcome) {
  if (outcome.ok) return undefined;
  if (outcome.reason === "unavailable") {
    return "Something went wrong. Please try again shortly.";
  }
  const minutes = Math.max(1, Math.ceil(outcome.retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function signup(prevState: AuthState, formData: FormData) {
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { name, email, password } = validated.data;
  try {
    const limit = await throttle("signup");
    if (!limit.ok) {
      return { message: throttleMessage(limit) };
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { message: "An account with this email already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    await createSession(user.id);
  } catch {
    return { message: "Failed to create account" };
  }
  redirect("/dashboard");
}

export async function login(prevState: AuthState, formData: FormData) {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { email, password } = validated.data;
  try {
    const limit = await throttle("login", { email });
    if (!limit.ok) {
      return { message: throttleMessage(limit) };
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      return { message: "Invalid email or password" };
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { message: "Invalid email or password" };
    }
    await createSession(user.id);
  } catch {
    return { message: "Login failed" };
  }
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/auth/login");
}

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email").trim(),
});

export async function forgotPassword(prevState: AuthState, formData: FormData) {
  const validated = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email } = validated.data;

  try {
    const limit = await throttle("forgot");
    if (!limit.ok) {
      return { message: throttleMessage(limit) };
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: "If an account exists with this email, a reset link has been sent." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiresAt },
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    const resetUrl = `${baseUrl}/auth/reset-password/${token}`;

    await sendPasswordResetEmail(user.email, resetUrl);
  } catch {
    return { message: "If an account exists with this email, a reset link has been sent." };
  }

  return { message: "If an account exists with this email, a reset link has been sent." };
}

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(prevState: AuthState, formData: FormData) {
  const validated = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { token, password } = validated.data;

  try {
    const limit = await throttle("reset");
    if (!limit.ok) {
      return { message: throttleMessage(limit) };
    }
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return { message: "Invalid or expired reset link. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await createSession(user.id);
  } catch {
    return { message: "Failed to reset password" };
  }

  redirect("/dashboard");
}
