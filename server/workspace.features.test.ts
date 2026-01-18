import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, workspaces, workspaceMembers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Workspace Creation and Settings", () => {
  let testUserId: number;
  let testWorkspaceId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db.insert(users).values({
      openId: `test-workspace-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
    });

    testUserId = Number(user.insertId);
  });

  it("should create a new workspace", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.workspace.create({
      name: "Test Household",
      currency: "€",
      myDisplayName: "Test Partner A",
      myAvatar: "dicebear:adventurer:test",
      myIncome: 5000,
    });

    expect(result.workspaceId).toBeDefined();
    testWorkspaceId = result.workspaceId;

    // Verify workspace was created
    const db = await getDb();
    const workspace = await db!
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, testWorkspaceId))
      .limit(1);

    expect(workspace.length).toBe(1);
    expect(workspace[0].name).toBe("Test Household");
    expect(workspace[0].currency).toBe("€");
    expect(workspace[0].ownerId).toBe(testUserId);

    // Verify member was created
    const member = await db!
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, testWorkspaceId))
      .limit(1);

    expect(member.length).toBe(1);
    expect(member[0].displayName).toBe("Test Partner A");
    expect(member[0].partner).toBe("A");
    expect(member[0].income).toBe("5000.00");
  });

  it("should list user's workspaces", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const workspaces = await caller.workspace.list();

    expect(workspaces.length).toBeGreaterThan(0);
    const testWorkspace = workspaces.find((w) => w.id === testWorkspaceId);
    expect(testWorkspace).toBeDefined();
    expect(testWorkspace!.name).toBe("Test Household");
    expect(testWorkspace!.currency).toBe("€");
    expect(testWorkspace!.myDisplayName).toBe("Test Partner A");
  });

  it("should update workspace settings", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.workspace.update({
      workspaceId: testWorkspaceId,
      name: "Updated Household",
      currency: "$",
    });

    expect(result.success).toBe(true);

    // Verify workspace was updated
    const db = await getDb();
    const workspace = await db!
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, testWorkspaceId))
      .limit(1);

    expect(workspace[0].name).toBe("Updated Household");
    expect(workspace[0].currency).toBe("$");
  });

  it("should prevent non-owner from updating workspace", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create another user
    const [otherUser] = await db.insert(users).values({
      openId: `test-other-${Date.now()}`,
      name: "Other User",
      email: "other@example.com",
      loginMethod: "test",
    });

    const otherUserId = Number(otherUser.insertId);

    const caller = appRouter.createCaller({
      user: { id: otherUserId, openId: "test-other", name: "Other User", email: "other@example.com" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.workspace.update({
        workspaceId: testWorkspaceId,
        name: "Hacked Name",
      })
    ).rejects.toThrow("Only workspace owner can update settings");
  });

  it("should delete workspace", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.workspace.delete({
      workspaceId: testWorkspaceId,
    });

    expect(result.success).toBe(true);

    // Verify workspace was deleted
    const db = await getDb();
    const workspace = await db!
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, testWorkspaceId))
      .limit(1);

    expect(workspace.length).toBe(0);
  });
});
