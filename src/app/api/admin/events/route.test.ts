import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockSetJSON = vi.fn();

vi.mock("@/lib/db", () => ({
  getEventsStore: () => ({
    get: mockGet,
    setJSON: mockSetJSON,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const ADMIN_TOKEN = "test-token-456";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;
});

const { GET, PATCH, DELETE } = await import("./route");

function makeRequest(method: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new Request("http://localhost/api/admin/events", {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as unknown as import("next/server").NextRequest;
}

describe("GET /api/admin/events", () => {
  it("returns 401 without auth", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns events list", async () => {
    mockGet.mockResolvedValue([
      { id: 1, name: "Event 1" },
      { id: 2, name: "Event 2" },
    ]);
    const res = await GET(makeRequest("GET", undefined, ADMIN_TOKEN));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});

describe("PATCH /api/admin/events", () => {
  it("updates event fields", async () => {
    mockGet.mockResolvedValue([
      { id: 1, name: "Old Name", year: 2000, type: "history" },
    ]);
    const res = await PATCH(
      makeRequest("PATCH", { id: 1, name: "New Name" }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.event.name).toBe("New Name");
    expect(mockSetJSON).toHaveBeenCalled();
  });

  it("returns 404 for missing event", async () => {
    mockGet.mockResolvedValue([]);
    const res = await PATCH(
      makeRequest("PATCH", { id: 999, name: "X" }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/admin/events", () => {
  it("removes event", async () => {
    mockGet.mockResolvedValue([
      { id: 1, name: "Event 1" },
      { id: 2, name: "Event 2" },
    ]);
    const res = await DELETE(
      makeRequest("DELETE", { id: 1 }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(200);
    expect(mockSetJSON).toHaveBeenCalledWith("all", [{ id: 2, name: "Event 2" }]);
  });

  it("returns 404 for missing event", async () => {
    mockGet.mockResolvedValue([]);
    const res = await DELETE(
      makeRequest("DELETE", { id: 999 }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(404);
  });
});
