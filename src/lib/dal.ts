import "server-only";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const session = await decrypt(sessionCookie);
  if (!session?.userId) return undefined;
  return { userId: session.userId };
}

export async function getCurrentUser() {
  const session = await verifySession();
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });
    return user;
  } catch {
    return null;
  }
}
