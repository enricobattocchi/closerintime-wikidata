import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getStore } from "@netlify/blobs";

function getNetlifyCredentials(): { siteID: string; token: string } {
  const statePath = join(__dirname, "..", ".netlify", "state.json");
  const state = JSON.parse(readFileSync(statePath, "utf-8"));
  const siteID = state.siteId;
  if (!siteID) throw new Error("No siteId — run 'netlify link' first");

  const configPath = join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".config", "netlify", "config.json"
  );
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const token = config.users?.[config.userId]?.auth?.token;
  if (!token) throw new Error("No auth token — run 'netlify login' first");

  return { siteID, token };
}

async function main() {
  const { siteID, token } = getNetlifyCredentials();
  const dir = join(__dirname, "..", "data", "backups");
  mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Backup events
  const eventsStore = getStore({ name: "events", siteID, token });
  const events = await eventsStore.get("all", { type: "json" });
  const eventsFile = join(dir, `events-${timestamp}.json`);
  writeFileSync(eventsFile, JSON.stringify(events, null, 2));
  console.log(`Events: ${Array.isArray(events) ? events.length : 0} → ${eventsFile}`);

  // Backup submissions
  const subStore = getStore({ name: "submissions", siteID, token });
  const { blobs } = await subStore.list();
  const submissions: Record<string, unknown>[] = [];
  for (const blob of blobs) {
    const data = await subStore.get(blob.key, { type: "json" });
    if (data) submissions.push({ key: blob.key, ...data as Record<string, unknown> });
  }
  const subsFile = join(dir, `submissions-${timestamp}.json`);
  writeFileSync(subsFile, JSON.stringify(submissions, null, 2));
  console.log(`Submissions: ${submissions.length} → ${subsFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
