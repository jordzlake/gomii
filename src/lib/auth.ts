import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { emptyStats, StatBlock } from "./stats";

const COOKIE = "gomii_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret-change-me");

export type UserDoc = {
  _id: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  avatarId: string;
  level: number;
  xp: number;
  coins: number;
  stats: StatBlock;
  streak: number;
  lastCompletedOn: string | null;
  createdAt: Date;
};

export type SessionUser = Omit<UserDoc, "passwordHash" | "_id"> & { id: string };

export function newUserDefaults(avatarId: string) {
  return {
    avatarId,
    level: 1,
    xp: 0,
    coins: 0,
    stats: emptyStats(),
    streak: 0,
    lastCompletedOn: null as string | null,
    createdAt: new Date(),
  };
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export function toSessionUser(doc: UserDoc): SessionUser {
  const { _id, passwordHash, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

export async function currentUser(): Promise<SessionUser | null> {
  const id = await getUserId();
  if (!id) return null;
  const db = await getDb();
  const doc = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(id) });
  return doc ? toSessionUser(doc) : null;
}
