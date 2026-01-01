import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth";
import { authenticateUser } from "@/lib/auth-users";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await authenticateUser(username, password);

  if (!user) {
    return NextResponse.json(
      { message: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = await createAuthToken(user);

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({
    user,
  });
}

