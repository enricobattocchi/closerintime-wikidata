import type { Event } from "./types";
import { EVENT_TYPES } from "./types";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

// Date properties to check, in priority order
// P585 = point in time, P580 = start time, P571 = inception, P577 = publication date
// P569 = date of birth, P619 = time of spacecraft launch, P620 = time of spacecraft landing
// P1191 = first performance, P606 = first flight
const DATE_PROPERTIES = ["P585", "P580", "P571", "P577", "P569", "P619", "P620", "P1191", "P606"];

/** Map a Wikidata type description to one of our EVENT_TYPES */
function mapType(typeLabel: string | undefined): string {
  if (!typeLabel) return "history";
  const lower = typeLabel.toLowerCase();

  // Order matters — more specific keywords first
  const mapping: [string, string][] = [
    // Space (before "human" to catch "human spaceflight")
    ["spaceflight", "transport"],
    ["space station", "transport"],
    ["space program", "science"],

    // People
    ["human", "person"],
    ["composer", "person"],
    ["politician", "person"],
    ["writer", "person"],
    ["author", "person"],
    ["actor", "person"],
    ["singer", "person"],
    ["musician", "person"],
    ["philosopher", "person"],
    ["scientist", "person"],
    ["inventor", "person"],
    ["painter", "person"],
    ["sculptor", "person"],
    ["architect", "person"],
    ["monarch", "person"],
    ["emperor", "person"],
    ["president", "person"],
    ["pharaoh", "person"],
    ["explorer", "person"],
    ["astronaut", "person"],
    ["athlete", "person"],
    ["footballer", "person"],

    // Military
    ["battle", "military"],
    ["war", "military"],
    ["military operation", "military"],
    ["military conflict", "military"],
    ["siege", "military"],
    ["bombing", "military"],
    ["invasion", "military"],
    ["armistice", "military"],

    // Disasters
    ["earthquake", "disaster"],
    ["tsunami", "disaster"],
    ["volcanic eruption", "disaster"],
    ["flood", "disaster"],
    ["famine", "disaster"],
    ["pandemic", "disaster"],
    ["epidemic", "disaster"],
    ["shipwreck", "disaster"],
    ["aviation accident", "disaster"],
    ["nuclear disaster", "disaster"],
    ["disaster", "disaster"],
    ["explosion", "disaster"],

    // Transport
    ["aircraft", "transport"],
    ["airplane", "transport"],
    ["ship", "transport"],
    ["locomotive", "transport"],
    ["automobile", "transport"],
    ["car model", "transport"],
    ["spacecraft", "transport"],
    ["space mission", "transport"],
    ["maiden voyage", "transport"],
    ["flight", "transport"],
    ["ocean liner", "transport"],
    ["rocket", "transport"],

    // Places
    ["city", "place"],
    ["country", "place"],
    ["territory", "place"],
    ["colony", "place"],
    ["kingdom", "place"],
    ["empire", "place"],
    ["republic", "place"],
    ["state", "place"],
    ["island", "place"],

    // Organizations
    ["organization", "organization"],
    ["company", "organization"],
    ["university", "organization"],
    ["political party", "organization"],
    ["religious order", "organization"],
    ["band", "organization"],
    ["sports team", "organization"],
    ["club", "organization"],
    ["association", "organization"],
    ["institution", "organization"],

    // Film & TV
    ["film", "film"],
    ["movie", "film"],
    ["television series", "film"],
    ["television film", "film"],
    ["animated film", "film"],
    ["documentary", "film"],
    ["short film", "film"],

    // Music
    ["album", "music"],
    ["song", "music"],
    ["single", "music"],
    ["symphony", "music"],
    ["concerto", "music"],
    ["musical composition", "music"],
    ["musical work", "music"],
    ["musical group", "music"],
    ["concert", "music"],
    ["opera", "music"],

    // Books & publications
    ["book", "book"],
    ["novel", "book"],
    ["poem", "book"],
    ["play", "book"],
    ["newspaper", "book"],
    ["magazine", "book"],
    ["encyclopedia", "book"],
    ["publication", "book"],
    ["literary work", "book"],
    ["comic", "book"],
    ["manga", "book"],
    ["academic journal", "book"],
    ["scientific article", "book"],

    // Art
    ["painting", "art"],
    ["sculpture", "art"],
    ["artwork", "art"],
    ["photograph", "art"],
    ["mural", "art"],
    ["fresco", "art"],
    ["mosaic", "art"],
    ["art exhibition", "art"],

    // Buildings & architecture
    ["building", "building"],
    ["bridge", "building"],
    ["monument", "building"],
    ["cathedral", "building"],
    ["church", "building"],
    ["mosque", "building"],
    ["temple", "building"],
    ["castle", "building"],
    ["palace", "building"],
    ["tower", "building"],
    ["skyscraper", "building"],
    ["dam", "building"],
    ["stadium", "building"],
    ["pyramid", "building"],
    ["lighthouse", "building"],
    ["fortification", "building"],

    // Science & technology
    ["invention", "science"],
    ["discovery", "science"],
    ["experiment", "science"],
    ["telescope", "science"],
    ["particle", "science"],
    ["chemical element", "science"],
    ["comet", "science"],
    ["asteroid", "science"],
    ["vaccine", "science"],

    // Computers & software
    ["software", "computer"],
    ["website", "computer"],
    ["video game", "computer"],
    ["programming language", "computer"],
    ["operating system", "computer"],
    ["mobile app", "computer"],
    ["smartphone", "computer"],
    ["computer", "computer"],
    ["console", "computer"],

    // Sport
    ["sport", "sport"],
    ["olympic games", "sport"],
    ["championship", "sport"],
    ["tournament", "sport"],
    ["world cup", "sport"],
    ["marathon", "sport"],
    ["race", "sport"],

    // Pop culture
    ["television", "pop culture"],
    ["tv show", "pop culture"],
    ["game show", "pop culture"],
    ["theme park", "pop culture"],
    ["award ceremony", "pop culture"],
    ["festival", "pop culture"],

    // History (general — catch-all for political/social events)
    ["revolution", "history"],
    ["treaty", "history"],
    ["election", "history"],
    ["assassination", "history"],
    ["coronation", "history"],
    ["referendum", "history"],
    ["declaration", "history"],
    ["constitution", "history"],
    ["ceremony", "history"],
    ["protest", "history"],
    ["rebellion", "history"],
    ["independence", "history"],
    ["annexation", "history"],
    ["coup", "history"],
  ];

  for (const [keyword, type] of mapping) {
    // Use word boundary matching to avoid partial matches (e.g. "opera" in "operating")
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lower)) return type;
  }

  return "history";
}

/** Parse a Wikidata time value like "+1969-07-20T00:00:00Z" */
function parseWikidataTime(timeValue: string): { year: number; month: number | null; day: number | null } | null {
  // Format: +YYYY-MM-DDT00:00:00Z or -YYYY-MM-DDT00:00:00Z
  const match = timeValue.match(/^([+-]?\d+)-(\d{2})-(\d{2})T/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  if (isNaN(year)) return null;

  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  return {
    year,
    month: month > 0 ? month : null,
    day: day > 0 ? day : null,
  };
}

interface WikidataClaim {
  mainsnak: {
    datavalue?: {
      value: { time: string; precision?: number } | { id: string } | string;
      type: string;
    };
  };
}

interface WikidataEntity {
  id: string;
  labels?: { en?: { value: string } };
  descriptions?: { en?: { value: string } };
  claims?: Record<string, WikidataClaim[]>;
  sitelinks?: { enwiki?: { url: string; title: string } };
}

/** Extract the best date from an entity's claims */
function extractDate(claims: Record<string, WikidataClaim[]>): { year: number; month: number | null; day: number | null } | null {
  for (const prop of DATE_PROPERTIES) {
    const propClaims = claims[prop];
    if (!propClaims?.length) continue;

    const dv = propClaims[0].mainsnak.datavalue;
    if (!dv || dv.type !== "time") continue;

    const timeVal = dv.value as { time: string };
    const parsed = parseWikidataTime(timeVal.time);
    if (parsed) return parsed;
  }
  return null;
}

/** Extract type label from P31 (instance of) claims */
function extractTypeLabel(claims: Record<string, WikidataClaim[]>): string | undefined {
  // We'll need labels for the P31 targets - for now return undefined
  // and let the caller resolve them
  return undefined;
}

/** Get English Wikipedia link from sitelinks */
function extractWikiLink(entity: WikidataEntity): string | null {
  const enwiki = entity.sitelinks?.enwiki;
  if (enwiki?.title) {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(enwiki.title.replace(/ /g, "_"))}`;
  }
  return null;
}

/** Fetch entities by Q-IDs and convert to Event[] */
async function entitiesToEvents(qids: string[]): Promise<Event[]> {
  if (qids.length === 0) return [];

  // wbgetentities supports up to 50 IDs at once
  const url = new URL(WIKIDATA_API);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", qids.join("|"));
  url.searchParams.set("props", "labels|descriptions|claims|sitelinks");
  url.searchParams.set("languages", "en");
  url.searchParams.set("sitefilter", "enwiki");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Wikidata API error: ${res.status}`);
  }

  const data = await res.json();
  const entities: Record<string, WikidataEntity> = data.entities || {};

  // Collect P31 target IDs we need labels for
  const typeTargetIds = new Set<string>();
  const entityTypeMap = new Map<string, string>(); // entity QID -> type target QID

  for (const [qid, entity] of Object.entries(entities)) {
    if (!entity.claims) continue;
    const p31Claims = entity.claims["P31"];
    if (p31Claims?.length) {
      const dv = p31Claims[0].mainsnak.datavalue;
      if (dv?.type === "wikibase-entityid") {
        const targetId = (dv.value as { id: string }).id;
        typeTargetIds.add(targetId);
        entityTypeMap.set(qid, targetId);
      }
    }
  }

  // Fetch labels for type targets
  const typeLabels = new Map<string, string>();
  if (typeTargetIds.size > 0) {
    const typeUrl = new URL(WIKIDATA_API);
    typeUrl.searchParams.set("action", "wbgetentities");
    typeUrl.searchParams.set("ids", [...typeTargetIds].join("|"));
    typeUrl.searchParams.set("props", "labels");
    typeUrl.searchParams.set("languages", "en");
    typeUrl.searchParams.set("format", "json");
    typeUrl.searchParams.set("origin", "*");

    const typeRes = await fetch(typeUrl.toString());
    if (typeRes.ok) {
      const typeData = await typeRes.json();
      for (const [id, ent] of Object.entries(typeData.entities || {})) {
        const label = (ent as WikidataEntity).labels?.en?.value;
        if (label) typeLabels.set(id, label);
      }
    }
  }

  const events: Event[] = [];

  for (const qid of qids) {
    const entity = entities[qid];
    if (!entity?.claims) continue;

    const date = extractDate(entity.claims);
    if (!date) continue;

    const label = entity.labels?.en?.value;
    if (!label) continue;

    const typeTargetId = entityTypeMap.get(qid);
    const typeLabel = typeTargetId ? typeLabels.get(typeTargetId) : undefined;

    events.push({
      id: qid,
      name: label,
      description: entity.descriptions?.en?.value ?? null,
      year: date.year,
      month: date.month,
      day: date.day,
      type: mapType(typeLabel),
      plural: 0,
      link: extractWikiLink(entity),
    });
  }

  return events;
}

/**
 * Search Wikidata for events matching a search term.
 * Step 1: Use wbsearchentities for fast text search (up to 30 candidates).
 * Step 2: Fetch entity data via wbgetentities, filter to those with dates.
 */
export async function searchWikidata(term: string): Promise<Event[]> {
  const searchUrl = new URL(WIKIDATA_API);
  searchUrl.searchParams.set("action", "wbsearchentities");
  searchUrl.searchParams.set("search", term);
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set("limit", "30");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("origin", "*");

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    throw new Error(`Wikidata search error: ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const qids: string[] = searchData.search?.map((r: { id: string }) => r.id) ?? [];

  if (qids.length === 0) return [];

  return entitiesToEvents(qids);
}

/** Fetch specific events by their Q-IDs */
export async function fetchWikidataEvents(qids: string[]): Promise<Event[]> {
  return entitiesToEvents(qids);
}
