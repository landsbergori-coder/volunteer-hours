import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

const COOKIE_NAME = "session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-do-not-use-in-production-please-change"
);

export type SessionPayload = {
  userId: number;
  role: Role;
  name: string;
  mustChangePassword?: boolean;
};

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as number,
      role: payload.role as Role,
      name: payload.name as string,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

/** Read the current session from cookies (Server Components / Actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

/** Set the session cookie (called from Route Handler / Server Action). */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Guard for Server Components/Actions — redirects to /login if not allowed. */
export async function requireRole(
  ...allowed: Role[]
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  if (allowed.length > 0 && !allowed.includes(session.role)) {
    redirect(dashboardPath(session.role));
  }
  return session;
}

export function dashboardPath(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "TEACHER":
      return "/teacher";
    case "ADMIN":
      return "/admin";
    case "SUPERVISOR":
      return "/supervisor";
    default:
      return "/login";
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
