import { describe, it, expect, vi, afterEach } from "vitest";
import { bestClaim, fetchWithRetry, searchWikidata, type WikidataClaim } from "./wikidata";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

function makeClaim(time: string, rank?: "preferred" | "normal" | "deprecated"): WikidataClaim {
  return {
    mainsnak: {
      datavalue: {
        value: { time },
        type: "time",
      },
    },
    rank,
  };
}

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the response directly on success", async () => {
    const mockRes = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockRes);
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries once on 429 and returns the second response", async () => {
    const retry429 = new Response(null, {
      status: 429,
      headers: { "Retry-After": "0" },
    });
    const success = new Response(JSON.stringify([]), { status: 200 });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(retry429)
      .mockResolvedValueOnce(success);
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries once on 503 and returns the second response", async () => {
    const retry503 = new Response(null, {
      status: 503,
      headers: { "Retry-After": "0" },
    });
    const success = new Response(JSON.stringify([]), { status: 200 });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(retry503)
      .mockResolvedValueOnce(success);
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns the second 429 response without a third attempt", async () => {
    const retry = new Response(null, { status: 429, headers: { "Retry-After": "0" } });
    const retry2 = new Response(null, { status: 429, headers: { "Retry-After": "0" } });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(retry)
      .mockResolvedValueOnce(retry2);
    const res = await fetchWithRetry("https://example.com/api");
    expect(res.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("bestClaim", () => {
  it("returns the preferred claim over normal ones", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "normal"),
      makeClaim("+2026-04-01T00:00:00Z", "preferred"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });

  it("skips deprecated claims", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "deprecated"),
      makeClaim("+2026-04-01T00:00:00Z", "normal"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });

  it("returns null when all claims are deprecated", () => {
    const claims = [
      makeClaim("+2026-02-15T00:00:00Z", "deprecated"),
      makeClaim("+2025-11-01T00:00:00Z", "deprecated"),
    ];
    expect(bestClaim(claims)).toBeNull();
  });

  it("returns the first normal claim when no preferred exists", () => {
    const claims = [
      makeClaim("+2020-01-01T00:00:00Z", "normal"),
      makeClaim("+2021-06-15T00:00:00Z", "normal"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2020-01-01T00:00:00Z");
  });

  it("handles claims without an explicit rank (treats as non-deprecated)", () => {
    const claims = [
      makeClaim("+1969-07-20T00:00:00Z"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+1969-07-20T00:00:00Z");
  });

  it("prefers preferred over claims with no rank", () => {
    const claims = [
      makeClaim("+2020-01-01T00:00:00Z"),
      makeClaim("+2026-04-01T00:00:00Z", "preferred"),
    ];
    const result = bestClaim(claims);
    expect((result!.mainsnak.datavalue!.value as { time: string }).time).toBe("+2026-04-01T00:00:00Z");
  });
});

describe("searchWikidata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates the term into the Wikidata search URL", async () => {
    const empty = () =>
      new Response(JSON.stringify({ search: [] }), { status: 200 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => empty());

    await searchWikidata("Napoleon", "en");
    await searchWikidata("Leonardo", "en");

    const urls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("search=Napoleon"))).toBe(true);
    expect(urls.some((u) => u.includes("search=Leonardo"))).toBe(true);
  });
});
