import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const UpdateNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export async function PATCH(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = UpdateNameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Failed to update name" }, { status: 500 });
  }
}
