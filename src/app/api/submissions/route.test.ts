import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSetJSON = vi.fn();
vi.mock("@/lib/db", () => ({
  getSubmissionsStore: () => ({
    setJSON: mockSetJSON,
  }),
}));

// Must import after mocks
const { POST } = await import("./route");

let ipCounter = 0;
function makeRequest(body: unknown, ip = `test-${++ipCounter}`) {
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const validBody = {
  name: "Test Event",
  year: 2000,
  month: 6,
  day: 15,
  type: "history",
  plural: 0,
  link: "https://en.wikipedia.org/wiki/Test",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/submissions", () => {
  it("rejects empty name", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/name/i);
  });

  it("rejects year=0", async () => {
    const res = await POST(makeRequest({ ...validBody, year: 0 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/year/i);
  });

  it("rejects invalid month", async () => {
    const res = await POST(makeRequest({ ...validBody, month: 13 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/month/i);
  });

  it("rejects invalid type", async () => {
    const res = await POST(makeRequest({ ...validBody, type: "nonsense" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/type/i);
  });

  it("rejects non-Wikipedia link", async () => {
    const res = await POST(makeRequest({ ...validBody, link: "https://example.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/wikipedia/i);
  });

  it("accepts valid submission", async () => {
    const res = await POST(makeRequest(validBody, `accept-${Date.now()}`));
    expect(res.status).toBe(201);
    expect(mockSetJSON).toHaveBeenCalled();
  });

  it("rate limits after 5 requests", async () => {
    const ip = `rate-limit-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(validBody, ip));
      expect(res.status).toBe(201);
    }
    const res = await POST(makeRequest(validBody, ip));
    expect(res.status).toBe(429);
  });
});
