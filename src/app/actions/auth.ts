"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
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
  redirect("/");
}
