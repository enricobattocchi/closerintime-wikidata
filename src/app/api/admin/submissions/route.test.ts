import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEventsGet = vi.fn();
const mockEventsSetJSON = vi.fn();
const mockSubGet = vi.fn();
const mockSubSetJSON = vi.fn();
const mockSubList = vi.fn();

vi.mock("@/lib/db", () => ({
  getEventsStore: () => ({
    get: mockEventsGet,
    setJSON: mockEventsSetJSON,
  }),
  getSubmissionsStore: () => ({
    get: mockSubGet,
    setJSON: mockSubSetJSON,
    list: mockSubList,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const ADMIN_TOKEN = "test-token-123";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;
});

const { GET, PATCH } = await import("./route");

function makeRequest(method: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new Request("http://localhost/api/admin/submissions", {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as unknown as import("next/server").NextRequest;
}

describe("GET /api/admin/submissions", () => {
  it("returns 401 without auth", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong token", async () => {
    const res = await GET(makeRequest("GET", undefined, "wrong"));
    expect(res.status).toBe(401);
  });

  it("returns submissions list", async () => {
    mockSubList.mockResolvedValue({
      blobs: [{ key: "sub-1" }],
    });
    mockSubGet.mockResolvedValue({ name: "Test", status: "pending" });

    const res = await GET(makeRequest("GET", undefined, ADMIN_TOKEN));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].key).toBe("sub-1");
  });
});

describe("PATCH /api/admin/submissions", () => {
  it("returns 401 without auth", async () => {
    const res = await PATCH(makeRequest("PATCH", { key: "sub-1", action: "approve" }));
    expect(res.status).toBe(401);
  });

  it("approves submission and creates event", async () => {
    const submission = {
      name: "Test Event",
      year: 2000,
      month: null,
      day: null,
      type: "history",
      plural: 0,
      link: "https://en.wikipedia.org/wiki/Test",
      status: "pending",
    };
    mockSubGet.mockResolvedValue(submission);
    mockEventsGet.mockResolvedValue([{ id: 5 }]);

    const res = await PATCH(
      makeRequest("PATCH", { key: "sub-1", action: "approve" }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.event.id).toBe(6);
    expect(mockEventsSetJSON).toHaveBeenCalled();
  });

  it("rejects submission and updates status", async () => {
    mockSubGet.mockResolvedValue({
      name: "Test",
      status: "pending",
    });

    const res = await PATCH(
      makeRequest("PATCH", { key: "sub-1", action: "reject" }, ADMIN_TOKEN)
    );
    expect(res.status).toBe(200);
    expect(mockSubSetJSON).toHaveBeenCalledWith("sub-1", expect.objectContaining({ status: "rejected" }));
  });
});
