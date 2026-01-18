import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Gas" | "Pet" | "Health" | "Other";

export interface Expense {
  id: number;
  description: string;
  amount: string;
  paidBy: Partner;
  splitType: SplitType;
  customSplitA?: number | null;
  category: Category;
  date: Date;
}

export function useExpenses() {
  const { currentWorkspaceId } = useWorkspace();
  const utils = trpc.useUtils();

  // Fetch expenses
  const { data: expenses = [], isLoading } = trpc.expense.list.useQuery(
    { workspaceId: currentWorkspaceId! },
    { enabled: !!currentWorkspaceId }
  );

  // Create expense
  const createMutation = trpc.expense.create.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate({ workspaceId: currentWorkspaceId! });
    },
  });

  // Update expense
  const updateMutation = trpc.expense.update.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate({ workspaceId: currentWorkspaceId! });
    },
  });

  // Delete expense
  const deleteMutation = trpc.expense.delete.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate({ workspaceId: currentWorkspaceId! });
    },
  });

  const addExpense = async (expense: {
    description: string;
    amount: number;
    paidBy: Partner;
    splitType: SplitType;
    customSplitA?: number;
    category: Category;
    date?: Date;
  }) => {
    if (!currentWorkspaceId) return;
    
    await createMutation.mutateAsync({
      workspaceId: currentWorkspaceId,
      ...expense,
      date: expense.date || new Date(),
    });
  };

  const updateExpense = async (expenseId: number, updates: {
    description?: string;
    amount?: number;
    paidBy?: Partner;
    splitType?: SplitType;
    customSplitA?: number;
    category?: Category;
  }) => {
    await updateMutation.mutateAsync({
      expenseId,
      ...updates,
    });
  };

  const deleteExpense = async (expenseId: number) => {
    await deleteMutation.mutateAsync({ expenseId });
  };

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
