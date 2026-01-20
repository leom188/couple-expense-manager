import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { workspaces, workspaceMembers, workspaceInvitations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Invitation System", () => {
  let testWorkspaceId: number;
  let testUserId: number = 1;
  let testInviteCode: string;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(workspaceInvitations).where(eq(workspaceInvitations.invitedBy, testUserId));
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, testUserId));
    await db.delete(workspaces).where(eq(workspaces.ownerId, testUserId));

    // Create test workspace
    const workspaceResult = await db.insert(workspaces).values({
      name: "Test Workspace",
      ownerId: testUserId,
      currency: "$",
    });
    testWorkspaceId = Number(workspaceResult[0].insertId);

    // Add test user as member
    await db.insert(workspaceMembers).values({
      workspaceId: testWorkspaceId,
      userId: testUserId,
      partner: "A",
      displayName: "Test User",
      avatar: "https://example.com/avatar.png",
      income: "5000.00",
    });
  });

  it("should create an invitation successfully", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-openid", name: "Test User" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.workspace.createInvitation({
      workspaceId: testWorkspaceId,
      inviteeEmail: "partner@example.com",
      expiresInDays: 7,
    });

    expect(result.inviteCode).toBeDefined();
    expect(result.inviteCode.length).toBeGreaterThan(0);
    expect(result.expiresAt).toBeInstanceOf(Date);

    testInviteCode = result.inviteCode;
  });

  it("should list invitations for a workspace", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-openid", name: "Test User" },
      req: {} as any,
      res: {} as any,
    });

    // Create invitation first
    const createResult = await caller.workspace.createInvitation({
      workspaceId: testWorkspaceId,
      inviteeEmail: "partner@example.com",
      expiresInDays: 7,
    });

    // List invitations
    const invitations = await caller.workspace.listInvitations({
      workspaceId: testWorkspaceId,
    });

    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations[0].inviteCode).toBe(createResult.inviteCode);
    expect(invitations[0].status).toBe("pending");
    expect(invitations[0].inviteeEmail).toBe("partner@example.com");
  });

  it("should cancel an invitation", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-openid", name: "Test User" },
      req: {} as any,
      res: {} as any,
    });

    // Create invitation
    await caller.workspace.createInvitation({
      workspaceId: testWorkspaceId,
      inviteeEmail: "partner@example.com",
      expiresInDays: 7,
    });

    // Get invitation ID
    const invitations = await caller.workspace.listInvitations({
      workspaceId: testWorkspaceId,
    });
    const invitationId = invitations[0].id;

    // Cancel invitation
    const result = await caller.workspace.cancelInvitation({
      invitationId,
    });

    expect(result.success).toBe(true);

    // Verify status changed
    const updatedInvitations = await caller.workspace.listInvitations({
      workspaceId: testWorkspaceId,
    });
    expect(updatedInvitations[0].status).toBe("cancelled");
  });

  it("should accept an invitation and add user to workspace", async () => {
    const caller1 = appRouter.createCaller({
      user: { id: testUserId, openId: "test-openid", name: "Test User" },
      req: {} as any,
      res: {} as any,
    });

    // Create invitation
    const createResult = await caller1.workspace.createInvitation({
      workspaceId: testWorkspaceId,
      expiresInDays: 7,
    });

    // Simulate second user accepting invitation
    const secondUserId = 999;
    const caller2 = appRouter.createCaller({
      user: { id: secondUserId, openId: "second-user-openid", name: "Second User" },
      req: {} as any,
      res: {} as any,
    });

    const acceptResult = await caller2.workspace.acceptInvitation({
      inviteCode: createResult.inviteCode,
      displayName: "Partner B",
      avatar: "https://example.com/avatar2.png",
      income: 6000,
    });

    expect(acceptResult.workspaceId).toBe(testWorkspaceId);

    // Verify user was added to workspace
    const workspaces = await caller2.workspace.list();
    const joinedWorkspace = workspaces.find((w) => w.id === testWorkspaceId);
    expect(joinedWorkspace).toBeDefined();
    expect(joinedWorkspace?.myPartner).toBe("B");
  });

  it("should reject expired invitation", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create expired invitation manually
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    const result = await db.insert(workspaceInvitations).values({
      workspaceId: testWorkspaceId,
      invitedBy: testUserId,
      inviteCode: "EXPIRED123",
      partnerSlot: "B",
      status: "pending",
      expiresAt: expiredDate,
    });

    const caller = appRouter.createCaller({
      user: { id: 999, openId: "test-openid-2", name: "Test User 2" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.workspace.acceptInvitation({
        inviteCode: "EXPIRED123",
        displayName: "Partner B",
        avatar: "https://example.com/avatar2.png",
        income: 6000,
      })
    ).rejects.toThrow("expired");
  });
});
