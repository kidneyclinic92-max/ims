import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserFromToken(token);

  if (!user) {
    cookieStore.delete("auth_token");
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

