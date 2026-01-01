import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type UserRole = "admin" | "staff";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export interface TokenPayload extends JWTPayload {
  sub: string;
  username: string;
  role: UserRole;
  fullName: string;
}

const DEFAULT_SECRET = "warehouse-inventory-secret";
const AUTH_SECRET = process.env.AUTH_SECRET ?? DEFAULT_SECRET;
const secretKey = new TextEncoder().encode(AUTH_SECRET);

function payloadToUser(payload: TokenPayload): AuthUser | null {
  if (
    typeof payload.sub !== "string" ||
    typeof payload.username !== "string" ||
    (payload.role !== "admin" && payload.role !== "staff") ||
    typeof payload.fullName !== "string"
  ) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    fullName: payload.fullName,
  };
}

export async function createAuthToken(user: AuthUser) {
  return new SignJWT({
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifyAuthToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(
  token: string
): Promise<AuthUser | null> {
  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  return payloadToUser(payload) ?? null;
}

