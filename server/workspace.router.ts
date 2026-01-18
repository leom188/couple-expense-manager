import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { workspaces, workspaceMembers, workspaceInvitations, InsertWorkspace, InsertWorkspaceMember, InsertWorkspaceInvitation } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const workspaceRouter = router({
  /**
   * Get all workspaces the current user is a member of
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db
      .select({
        workspace: workspaces,
        member: workspaceMembers,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, ctx.user.id));

    return result.map((r) => ({
      ...r.workspace,
      myPartner: r.member.partner,
      myDisplayName: r.member.displayName,
      myAvatar: r.member.avatar,
      myIncome: r.member.income,
    }));
  }),

  /**
   * Get workspace details with all members
   */
  get: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user is a member
      const membership = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
      }

      const workspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);

      if (workspace.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      const members = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, input.workspaceId));

      return {
        ...workspace[0],
        members,
        myMembership: membership[0],
      };
    }),

  /**
   * Create a new workspace
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        currency: z.string().default("$"),
        myDisplayName: z.string().min(1).max(255),
        myAvatar: z.string(),
        myIncome: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Create workspace
      const workspaceData: InsertWorkspace = {
        name: input.name,
        ownerId: ctx.user.id,
        currency: input.currency,
      };

      const workspaceResult = await db.insert(workspaces).values(workspaceData);
      const workspaceId = Number(workspaceResult[0].insertId);

      // Add creator as Partner A
      const memberData: InsertWorkspaceMember = {
        workspaceId,
        userId: ctx.user.id,
        partner: "A",
        displayName: input.myDisplayName,
        avatar: input.myAvatar,
        income: input.myIncome.toString(),
      };

      await db.insert(workspaceMembers).values(memberData);

      return { workspaceId };
    }),

  /**
   * Update workspace settings
   */
  update: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        name: z.string().min(1).max(255).optional(),
        currency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user is owner
      const workspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);

      if (workspace.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      if (workspace[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only workspace owner can update settings" });
      }

      const updateData: Partial<InsertWorkspace> = {};
      if (input.name) updateData.name = input.name;
      if (input.currency) updateData.currency = input.currency;

      await db.update(workspaces).set(updateData).where(eq(workspaces.id, input.workspaceId));

      return { success: true };
    }),

  /**
   * Update member profile in workspace
   */
  updateMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        displayName: z.string().min(1).max(255).optional(),
        avatar: z.string().optional(),
        income: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Partial<InsertWorkspaceMember> = {};
      if (input.displayName) updateData.displayName = input.displayName;
      if (input.avatar) updateData.avatar = input.avatar;
      if (input.income !== undefined) updateData.income = input.income.toString();

      await db
        .update(workspaceMembers)
        .set(updateData)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Create an invitation
   */
  createInvitation: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        inviteeEmail: z.string().email().optional(),
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user is a member
      const membership = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
      }

      // Check which partner slot is available
      const members = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, input.workspaceId));

      const takenPartners = new Set(members.map((m) => m.partner));
      let availablePartner: "A" | "B" | null = null;

      if (!takenPartners.has("A")) availablePartner = "A";
      else if (!takenPartners.has("B")) availablePartner = "B";

      if (!availablePartner) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Workspace is full (max 2 members)" });
      }

      // Create invitation
      const inviteCode = nanoid(16);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const invitationData: InsertWorkspaceInvitation = {
        workspaceId: input.workspaceId,
        invitedBy: ctx.user.id,
        inviteCode,
        inviteeEmail: input.inviteeEmail,
        partnerSlot: availablePartner,
        status: "pending",
        expiresAt,
      };

      await db.insert(workspaceInvitations).values(invitationData);

      return { inviteCode, expiresAt };
    }),

  /**
   * Accept an invitation
   */
  acceptInvitation: protectedProcedure
    .input(
      z.object({
        inviteCode: z.string(),
        displayName: z.string().min(1).max(255),
        avatar: z.string(),
        income: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find invitation
      const invitation = await db
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.inviteCode, input.inviteCode))
        .limit(1);

      if (invitation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation code" });
      }

      const inv = invitation[0];

      // Check invitation status
      if (inv.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation already used or expired" });
      }

      if (new Date() > inv.expiresAt) {
        await db.update(workspaceInvitations).set({ status: "expired" }).where(eq(workspaceInvitations.id, inv.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, inv.workspaceId),
            eq(workspaceMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are already a member of this workspace" });
      }

      // Add user as member
      const memberData: InsertWorkspaceMember = {
        workspaceId: inv.workspaceId,
        userId: ctx.user.id,
        partner: inv.partnerSlot,
        displayName: input.displayName,
        avatar: input.avatar,
        income: input.income.toString(),
      };

      await db.insert(workspaceMembers).values(memberData);

      // Mark invitation as accepted
      await db
        .update(workspaceInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          acceptedBy: ctx.user.id,
        })
        .where(eq(workspaceInvitations.id, inv.id));

      return { workspaceId: inv.workspaceId };
    }),

  /**
   * Get pending invitations for a workspace
   */
  listInvitations: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user is a member
      const membership = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
      }

      const invitations = await db
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.workspaceId, input.workspaceId));

      return invitations;
    }),

  /**
   * Cancel an invitation
   */
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user created this invitation
      const invitation = await db
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, input.invitationId))
        .limit(1);

      if (invitation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation[0].invitedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel invitations you created" });
      }

      await db
        .update(workspaceInvitations)
        .set({ status: "cancelled" })
        .where(eq(workspaceInvitations.id, input.invitationId));

      return { success: true };
    }),

  /**
   * Delete workspace (owner only)
   */
  delete: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user is owner
      const workspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);

      if (workspace.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      if (workspace[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the workspace owner can delete the workspace" });
      }

      // Delete workspace (cascading deletes will handle related records)
      await db.delete(workspaces).where(eq(workspaces.id, input.workspaceId));

      return { success: true };
    }),
});
