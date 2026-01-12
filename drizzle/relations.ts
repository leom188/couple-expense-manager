import { relations } from "drizzle-orm";
import { 
  users, 
  workspaces, 
  workspaceMembers, 
  workspaceInvitations, 
  expenses, 
  recurringExpenses,
  budgets 
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  ownedWorkspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  sentInvitations: many(workspaceInvitations),
  createdExpenses: many(expenses),
  createdRecurringExpenses: many(recurringExpenses),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  invitations: many(workspaceInvitations),
  expenses: many(expenses),
  recurringExpenses: many(recurringExpenses),
  budgets: many(budgets),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const workspaceInvitationsRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvitations.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [workspaceInvitations.invitedBy],
    references: [users.id],
  }),
  accepter: one(users, {
    fields: [workspaceInvitations.acceptedBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [expenses.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export const recurringExpensesRelations = relations(recurringExpenses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [recurringExpenses.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [recurringExpenses.createdBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [budgets.workspaceId],
    references: [workspaces.id],
  }),
}));
