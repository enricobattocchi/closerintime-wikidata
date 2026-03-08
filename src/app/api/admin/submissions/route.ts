import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEventsStore, getSubmissionsStore } from "@/lib/db";
import type { Event, Submission } from "@/lib/types";

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getSubmissionsStore();
  const { blobs } = await store.list();
  const submissions: Array<{ key: string } & Submission> = [];

  for (const blob of blobs) {
    const data: Submission | null = await store.get(blob.key, { type: "json" });
    if (data) {
      submissions.push({ key: blob.key, ...data });
    }
  }

  return NextResponse.json(submissions);
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

  const { key, action, name, year, month, day, type, plural, link } = body as {
    key: string; action: string;
    name?: string; year?: number; month?: number | null; day?: number | null;
    type?: string; plural?: number; link?: string;
  };

  if (!key || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid key or action" }, { status: 400 });
  }

  const subStore = getSubmissionsStore();
  const submission: Submission | null = await subStore.get(key, { type: "json" });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ error: "Submission already processed" }, { status: 400 });
  }

  if (action === "reject") {
    await subStore.setJSON(key, { ...submission, status: "rejected" });
    return NextResponse.json({ message: "Submission rejected" });
  }

  // Approve: add to events store
  const eventsStore = getEventsStore();
  const allEvents: Event[] = (await eventsStore.get("all", { type: "json" })) || [];
  const maxId = allEvents.reduce((max, e) => Math.max(max, e.id), 0);

  const newEvent: Event = {
    id: maxId + 1,
    name: name ?? submission.name,
    year: year ?? submission.year,
    month: month !== undefined ? month : submission.month,
    day: day !== undefined ? day : submission.day,
    type: type || submission.type,
    enabled: 1,
    plural: plural ?? submission.plural,
    link: link ?? submission.link,
  };

  allEvents.push(newEvent);
  await eventsStore.setJSON("all", allEvents);
  await subStore.setJSON(key, { ...submission, status: "approved" });
  revalidatePath("/", "layout");

  return NextResponse.json({ message: "Submission approved", event: newEvent });
}
