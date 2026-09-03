import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession, newUserDefaults } from "@/lib/auth";
import { AVATARS } from "@/data/sprites";

export async function POST(req: Request) {
  const { email, password, username, avatarId } = await req.json();

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Passwords need at least 8 characters." }, { status: 400 });
  }
  if (typeof username !== "string" || username.trim().length < 2) {
    return NextResponse.json({ error: "Pick a character name of two characters or more." }, { status: 400 });
  }
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];

  const db = await getDb();
  const users = db.collection("users");
  const clash = await users.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.trim() }] });
  if (clash) {
    return NextResponse.json({ error: "That email or character name is already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    email: email.toLowerCase(),
    username: username.trim(),
    passwordHash,
    ...newUserDefaults(avatar.id),
  });

  await createSession(result.insertedId.toString());
  return NextResponse.json({ ok: true });
}
