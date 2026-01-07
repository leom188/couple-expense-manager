import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { expenses, recurringExpenses, budgets, workspaceMembers, InsertExpense, InsertRecurringExpense, InsertBudget } from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const categoryEnum = z.enum(["Groceries", "Rent", "Utilities", "Fun", "Gas", "Pet", "Health", "Other"]);
const partnerEnum = z.enum(["A", "B"]);
const splitTypeEnum = z.enum(["50/50", "income", "custom"]);
const frequencyEnum = z.enum(["Monthly", "Weekly"]);

export const expenseRouter = router({
  /**
   * List expenses for a workspace
   */
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        category: categoryEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify membership
      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      let query = db
        .select()
        .from(expenses)
        .where(eq(expenses.workspaceId, input.workspaceId))
        .orderBy(desc(expenses.date));

      const result = await query;

      // Apply filters in memory (simpler than complex SQL)
      let filtered = result;
      if (input.startDate) {
        filtered = filtered.filter((e) => new Date(e.date) >= input.startDate!);
      }
      if (input.endDate) {
        filtered = filtered.filter((e) => new Date(e.date) <= input.endDate!);
      }
      if (input.category) {
        filtered = filtered.filter((e) => e.category === input.category);
      }

      return filtered;
    }),

  /**
   * Create an expense
   */
  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        description: z.string().min(1).max(500),
        amount: z.number().positive(),
        paidBy: partnerEnum,
        splitType: splitTypeEnum,
        customSplitA: z.number().min(0).max(100).optional(),
        category: categoryEnum,
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify membership
      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      const expenseData: InsertExpense = {
        workspaceId: input.workspaceId,
        description: input.description,
        amount: input.amount.toFixed(2),
        paidBy: input.paidBy,
        splitType: input.splitType,
        customSplitA: input.customSplitA,
        category: input.category,
        date: input.date,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(expenses).values(expenseData);

      return { expenseId: Number(result[0].insertId) };
    }),

  /**
   * Update an expense
   */
  update: protectedProcedure
    .input(
      z.object({
        expenseId: z.number(),
        description: z.string().min(1).max(500).optional(),
        amount: z.number().positive().optional(),
        paidBy: partnerEnum.optional(),
        splitType: splitTypeEnum.optional(),
        customSplitA: z.number().min(0).max(100).optional(),
        category: categoryEnum.optional(),
        date: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get expense and verify access
      const expense = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, input.expenseId))
        .limit(1);

      if (expense.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      await verifyWorkspaceMembership(db, ctx.user.id, expense[0].workspaceId);

      const updateData: Partial<InsertExpense> = {};
      if (input.description) updateData.description = input.description;
      if (input.amount) updateData.amount = input.amount.toFixed(2);
      if (input.paidBy) updateData.paidBy = input.paidBy;
      if (input.splitType) updateData.splitType = input.splitType;
      if (input.customSplitA !== undefined) updateData.customSplitA = input.customSplitA;
      if (input.category) updateData.category = input.category;
      if (input.date) updateData.date = input.date;

      await db.update(expenses).set(updateData).where(eq(expenses.id, input.expenseId));

      return { success: true };
    }),

  /**
   * Delete an expense
   */
  delete: protectedProcedure
    .input(z.object({ expenseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get expense and verify access
      const expense = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, input.expenseId))
        .limit(1);

      if (expense.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      await verifyWorkspaceMembership(db, ctx.user.id, expense[0].workspaceId);

      await db.delete(expenses).where(eq(expenses.id, input.expenseId));

      return { success: true };
    }),

  /**
   * List recurring expenses
   */
  listRecurring: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      return await db
        .select()
        .from(recurringExpenses)
        .where(eq(recurringExpenses.workspaceId, input.workspaceId))
        .orderBy(desc(recurringExpenses.nextDueDate));
    }),

  /**
   * Create recurring expense
   */
  createRecurring: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        description: z.string().min(1).max(500),
        amount: z.number().positive(),
        paidBy: partnerEnum,
        splitType: splitTypeEnum,
        category: categoryEnum,
        frequency: frequencyEnum,
        nextDueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      const recurringData: InsertRecurringExpense = {
        workspaceId: input.workspaceId,
        description: input.description,
        amount: input.amount.toFixed(2),
        paidBy: input.paidBy,
        splitType: input.splitType,
        category: input.category,
        frequency: input.frequency,
        nextDueDate: input.nextDueDate,
        isActive: true,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(recurringExpenses).values(recurringData);

      return { recurringExpenseId: Number(result[0].insertId) };
    }),

  /**
   * Update recurring expense
   */
  updateRecurring: protectedProcedure
    .input(
      z.object({
        recurringExpenseId: z.number(),
        description: z.string().min(1).max(500).optional(),
        amount: z.number().positive().optional(),
        paidBy: partnerEnum.optional(),
        splitType: splitTypeEnum.optional(),
        category: categoryEnum.optional(),
        frequency: frequencyEnum.optional(),
        nextDueDate: z.date().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const recurring = await db
        .select()
        .from(recurringExpenses)
        .where(eq(recurringExpenses.id, input.recurringExpenseId))
        .limit(1);

      if (recurring.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurring expense not found" });
      }

      await verifyWorkspaceMembership(db, ctx.user.id, recurring[0].workspaceId);

      const updateData: Partial<InsertRecurringExpense> = {};
      if (input.description) updateData.description = input.description;
      if (input.amount) updateData.amount = input.amount.toFixed(2);
      if (input.paidBy) updateData.paidBy = input.paidBy;
      if (input.splitType) updateData.splitType = input.splitType;
      if (input.category) updateData.category = input.category;
      if (input.frequency) updateData.frequency = input.frequency;
      if (input.nextDueDate) updateData.nextDueDate = input.nextDueDate;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(recurringExpenses).set(updateData).where(eq(recurringExpenses.id, input.recurringExpenseId));

      return { success: true };
    }),

  /**
   * Delete recurring expense
   */
  deleteRecurring: protectedProcedure
    .input(z.object({ recurringExpenseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const recurring = await db
        .select()
        .from(recurringExpenses)
        .where(eq(recurringExpenses.id, input.recurringExpenseId))
        .limit(1);

      if (recurring.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurring expense not found" });
      }

      await verifyWorkspaceMembership(db, ctx.user.id, recurring[0].workspaceId);

      await db.delete(recurringExpenses).where(eq(recurringExpenses.id, input.recurringExpenseId));

      return { success: true };
    }),

  /**
   * Get budgets for workspace
   */
  getBudgets: protectedProcedure
    .input(z.object({ workspaceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      return await db.select().from(budgets).where(eq(budgets.workspaceId, input.workspaceId));
    }),

  /**
   * Set budget for a category
   */
  setBudget: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number(),
        category: categoryEnum,
        amount: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await verifyWorkspaceMembership(db, ctx.user.id, input.workspaceId);

      const budgetData: InsertBudget = {
        workspaceId: input.workspaceId,
        category: input.category,
        amount: input.amount.toFixed(2),
      };

      await db
        .insert(budgets)
        .values(budgetData)
        .onDuplicateKeyUpdate({
          set: { amount: input.amount.toFixed(2) },
        });

      return { success: true };
    }),
});

// Helper function to verify workspace membership
async function verifyWorkspaceMembership(db: any, userId: number, workspaceId: number) {
  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (membership.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
  }

  return membership[0];
}
