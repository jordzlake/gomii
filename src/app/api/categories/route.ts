import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { ICONS, IconName } from "@/data/sprites";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const icon = (body.icon in ICONS ? body.icon : "checklist") as IconName;
  if (name.length < 2) return NextResponse.json({ error: "Name the category." }, { status: 400 });

  const db = await getDb();
  const exists = await db.collection("categories").findOne({ userId, name });
  if (exists) return NextResponse.json({ error: "You already have that category." }, { status: 409 });

  await db.collection("categories").insertOne({ userId, name, icon, createdAt: new Date() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Unknown category." }, { status: 400 });

  const db = await getDb();
  await db.collection("categories").deleteOne({ _id: new ObjectId(id), userId });
  return NextResponse.json({ ok: true });
}
