import { useState, useMemo } from "react";
import { toast } from "sonner";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  customSplitA?: number;
  category: Category;
  date: string;
}

interface UseExpenseListProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export function useExpenseList({ expenses, setExpenses }: UseExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter expenses based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;

    const query = searchQuery.toLowerCase();
    return expenses.filter((expense) => {
      return (
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      );
    });
  }, [expenses, searchQuery]);

  // Delete expense with undo functionality
  const deleteExpense = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    
    const expenseToDelete = expenses.find((e) => e.id === id);
    setExpenses(expenses.filter((e) => e.id !== id));

    toast.success("Expense deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          if (expenseToDelete) {
            setExpenses((prev) => [expenseToDelete, ...prev]);
            toast.success("Expense restored");
          }
        },
      },
    });
  };

  // Update expense
  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === id ? { ...expense, ...updates } : expense))
    );
  };

  // Add expense
  const addExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });

    return groups;
  }, [filteredExpenses]);

  // Get expenses by category
  const expensesByCategory = useMemo(() => {
    const byCategory: Record<Category, Expense[]> = {
      Groceries: [],
      Rent: [],
      Utilities: [],
      Fun: [],
      Other: [],
    };

    expenses.forEach((expense) => {
      byCategory[expense.category].push(expense);
    });

    return byCategory;
  }, [expenses]);

  // Calculate total by category
  const totalsByCategory = useMemo(() => {
    const totals: Record<Category, number> = {
      Groceries: 0,
      Rent: 0,
      Utilities: 0,
      Fun: 0,
      Other: 0,
    };

    expenses.forEach((expense) => {
      totals[expense.category] += expense.amount;
    });

    return totals;
  }, [expenses]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    
    // Filtered/grouped data
    filteredExpenses,
    groupedExpenses,
    expensesByCategory,
    totalsByCategory,
    
    // Actions
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
