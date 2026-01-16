import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { workspaces, workspaceMembers, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Workspace Switching", () => {
  let testUserId: number;
  let workspace1Id: number;
  let workspace2Id: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, 999));
    await db.delete(workspaces).where(eq(workspaces.ownerId, 999));
    await db.delete(users).where(eq(users.id, 999));

    // Create test user
    const userResult = await db.insert(users).values({
      id: 999,
      openId: "test-user-workspace-switching",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });

    testUserId = 999;

    // Create first workspace
    const ws1Result = await db.insert(workspaces).values({
      name: "Home Expenses",
      ownerId: testUserId,
      currency: "$",
    });
    workspace1Id = Number(ws1Result[0].insertId);

    await db.insert(workspaceMembers).values({
      workspaceId: workspace1Id,
      userId: testUserId,
      partner: "A",
      displayName: "Test User",
      avatar: "dicebear:adventurer:seed1",
      income: "5000",
    });

    // Create second workspace
    const ws2Result = await db.insert(workspaces).values({
      name: "Personal Expenses",
      ownerId: testUserId,
      currency: "€",
    });
    workspace2Id = Number(ws2Result[0].insertId);

    await db.insert(workspaceMembers).values({
      workspaceId: workspace2Id,
      userId: testUserId,
      partner: "A",
      displayName: "Test User",
      avatar: "dicebear:avataaars:seed2",
      income: "3000",
    });
  });

  it("should list all workspaces for a user", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({
        workspace: workspaces,
        member: workspaceMembers,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, testUserId));

    expect(result).toHaveLength(2);
    expect(result[0].workspace.name).toBe("Home Expenses");
    expect(result[1].workspace.name).toBe("Personal Expenses");
  });

  it("should retrieve workspace details with correct currency", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const workspace1 = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace1Id))
      .limit(1);

    const workspace2 = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace2Id))
      .limit(1);

    expect(workspace1[0].currency).toBe("$");
    expect(workspace2[0].currency).toBe("€");
  });

  it("should retrieve member info for specific workspace", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const member1 = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace1Id),
          eq(workspaceMembers.userId, testUserId)
        )
      )
      .limit(1);

    const member2 = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace2Id),
          eq(workspaceMembers.userId, testUserId)
        )
      )
      .limit(1);

    expect(member1[0].avatar).toBe("dicebear:adventurer:seed1");
    expect(member2[0].avatar).toBe("dicebear:avataaars:seed2");
    expect(member1[0].income).toBe("5000.00");
    expect(member2[0].income).toBe("3000.00");
  });

  it("should support user being member of multiple workspaces", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const memberships = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, testUserId));

    expect(memberships).toHaveLength(2);
    expect(memberships.map((m) => m.workspaceId)).toContain(workspace1Id);
    expect(memberships.map((m) => m.workspaceId)).toContain(workspace2Id);
  });
});
