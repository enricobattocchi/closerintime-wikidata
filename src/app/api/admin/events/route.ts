import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEventsStore } from "@/lib/db";
import type { Event } from "@/lib/types";

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getEventsStore();
  const events: Event[] = (await store.get("all", { type: "json" })) || [];
  return NextResponse.json(events);
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...fields } = body as {
    id: number;
    name?: string; year?: number; month?: number | null; day?: number | null;
    type?: string; plural?: number; link?: string | null; enabled?: number;
  };

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Event id is required" }, { status: 400 });
  }

  const store = getEventsStore();
  const events: Event[] = (await store.get("all", { type: "json" })) || [];
  const idx = events.findIndex((e) => e.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const updated = { ...events[idx] };
  if (fields.name !== undefined) updated.name = fields.name;
  if (fields.year !== undefined) updated.year = fields.year;
  if (fields.month !== undefined) updated.month = fields.month;
  if (fields.day !== undefined) updated.day = fields.day;
  if (fields.type !== undefined) updated.type = fields.type;
  if (fields.plural !== undefined) updated.plural = fields.plural;
  if (fields.link !== undefined) updated.link = fields.link;
  if (fields.enabled !== undefined) updated.enabled = fields.enabled;

  events[idx] = updated;
  await store.setJSON("all", events);
  revalidatePath("/", "layout");

  return NextResponse.json({ message: "Event updated", event: updated });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body as { id: number };

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Event id is required" }, { status: 400 });
  }

  const store = getEventsStore();
  const events: Event[] = (await store.get("all", { type: "json" })) || [];
  const filtered = events.filter((e) => e.id !== id);

  if (filtered.length === events.length) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await store.setJSON("all", filtered);
  revalidatePath("/", "layout");
  return NextResponse.json({ message: "Event deleted" });
}
