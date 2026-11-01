import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    user: user
      ? { id: user.id, name: user.name, email: user.email }
      : null,
  });
}
