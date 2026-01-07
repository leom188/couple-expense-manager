import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workspaces (households) - shared expense tracking space
 */
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** User who created the workspace */
  ownerId: int("ownerId").notNull(),
  /** Currency symbol for the workspace */
  currency: varchar("currency", { length: 10 }).default("$").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Workspace members - links users to workspaces with their role
 */
export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  /** Partner identifier within the workspace (A or B) */
  partner: mysqlEnum("partner", ["A", "B"]).notNull(),
  /** Member's display name in this workspace */
  displayName: varchar("displayName", { length: 255 }).notNull(),
  /** DiceBear avatar URL (dicebear:style:seed) */
  avatar: text("avatar").notNull(),
  /** Monthly income for split calculations */
  income: decimal("income", { precision: 10, scale: 2 }).default("0").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  workspaceUserIdx: unique("workspace_user_unique").on(table.workspaceId, table.userId),
  workspacePartnerIdx: unique("workspace_partner_unique").on(table.workspaceId, table.partner),
  userIdx: index("user_idx").on(table.userId),
}));

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = typeof workspaceMembers.$inferInsert;

/**
 * Workspace invitations - for inviting partners
 */
export const workspaceInvitations = mysqlTable("workspace_invitations", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  /** User who sent the invitation */
  invitedBy: int("invitedBy").notNull(),
  /** Unique invitation code */
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  /** Optional email of invitee */
  inviteeEmail: varchar("inviteeEmail", { length: 320 }),
  /** Partner slot this invitation is for (A or B) */
  partnerSlot: mysqlEnum("partnerSlot", ["A", "B"]).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedBy: int("acceptedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  inviteCodeIdx: index("invite_code_idx").on(table.inviteCode),
  workspaceIdx: index("workspace_idx").on(table.workspaceId),
}));

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type InsertWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;

/**
 * Expenses - shared expense records
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  /** Partner who paid (A or B) */
  paidBy: mysqlEnum("paidBy", ["A", "B"]).notNull(),
  /** How the expense is split */
  splitType: mysqlEnum("splitType", ["50/50", "income", "custom"]).notNull(),
  /** Custom split percentage for Partner A (0-100) */
  customSplitA: int("customSplitA"),
  category: mysqlEnum("category", ["Groceries", "Rent", "Utilities", "Fun", "Gas", "Pet", "Health", "Other"]).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** User who created this expense */
  createdBy: int("createdBy").notNull(),
}, (table) => ({
  workspaceIdx: index("workspace_idx").on(table.workspaceId),
  dateIdx: index("date_idx").on(table.date),
}));

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Recurring expenses - scheduled recurring bills
 */
export const recurringExpenses = mysqlTable("recurring_expenses", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  /** Partner who pays (A or B) */
  paidBy: mysqlEnum("paidBy", ["A", "B"]).notNull(),
  /** How the expense is split */
  splitType: mysqlEnum("splitType", ["50/50", "income", "custom"]).notNull(),
  category: mysqlEnum("category", ["Groceries", "Rent", "Utilities", "Fun", "Gas", "Pet", "Health", "Other"]).notNull(),
  frequency: mysqlEnum("frequency", ["Monthly", "Weekly"]).notNull(),
  nextDueDate: timestamp("nextDueDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** User who created this recurring expense */
  createdBy: int("createdBy").notNull(),
}, (table) => ({
  workspaceIdx: index("workspace_idx").on(table.workspaceId),
  nextDueDateIdx: index("next_due_date_idx").on(table.nextDueDate),
}));

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type InsertRecurringExpense = typeof recurringExpenses.$inferInsert;

/**
 * Budgets - category budgets per workspace
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  category: mysqlEnum("category", ["Groceries", "Rent", "Utilities", "Fun", "Gas", "Pet", "Health", "Other"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  workspaceCategoryIdx: unique("workspace_category_unique").on(table.workspaceId, table.category),
}));

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
