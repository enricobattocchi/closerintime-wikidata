import { NextResponse } from "next/server";
import { getEnabledEvents } from "@/lib/events";

export const revalidate = 3600;

export async function GET() {
  const events = await getEnabledEvents();
  return NextResponse.json(events);
}
