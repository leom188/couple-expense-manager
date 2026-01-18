import { useMemo } from "react";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";

export interface Expense {
  id: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  customSplitA?: number;
  date: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  income: number;
}

export interface Profiles {
  A: UserProfile;
  B: UserProfile;
}

interface UseSettlementProps {
  expenses: Expense[];
  profiles: Profiles;
}

export function useSettlement({ expenses, profiles }: UseSettlementProps) {
  // Calculate settlement balance
  // Positive balance means B owes A
  // Negative balance means A owes B
  const balance = useMemo(() => {
    let calculatedBalance = 0;

    expenses.forEach((expense) => {
      const amount = expense.amount;
      let shareA = 0;

      if (expense.splitType === "50/50") {
        shareA = amount * 0.5;
      } else if (expense.splitType === "income") {
        const totalIncome = profiles.A.income + profiles.B.income;
        const ratioA = totalIncome > 0 ? profiles.A.income / totalIncome : 0.5;
        shareA = amount * ratioA;
      } else if (expense.splitType === "custom") {
        const percentageA = expense.customSplitA !== undefined ? expense.customSplitA : 50;
        shareA = amount * (percentageA / 100);
      }

      const shareB = amount - shareA;

      if (expense.paidBy === "A") {
        calculatedBalance += shareB; // B owes A their share
      } else {
        calculatedBalance -= shareA; // A owes B their share
      }
    });

    return calculatedBalance;
  }, [expenses, profiles]);

  // Settlement text description
  const settlementText = useMemo(() => {
    if (balance === 0) {
      return "All settled up!";
    } else if (balance > 0) {
      return `${profiles.B.name} owes ${profiles.A.name}`;
    } else {
      return `${profiles.A.name} owes ${profiles.B.name}`;
    }
  }, [balance, profiles]);

  // Settlement amount (absolute value)
  const settlementAmount = useMemo(() => {
    return Math.abs(balance).toFixed(2);
  }, [balance]);

  // Calculate individual contributions
  const contributions = useMemo(() => {
    let paidByA = 0;
    let paidByB = 0;
    let owedByA = 0;
    let owedByB = 0;

    expenses.forEach((expense) => {
      const amount = expense.amount;
      let shareA = 0;

      if (expense.splitType === "50/50") {
        shareA = amount * 0.5;
      } else if (expense.splitType === "income") {
        const totalIncome = profiles.A.income + profiles.B.income;
        const ratioA = totalIncome > 0 ? profiles.A.income / totalIncome : 0.5;
        shareA = amount * ratioA;
      } else if (expense.splitType === "custom") {
        const percentageA = expense.customSplitA !== undefined ? expense.customSplitA : 50;
        shareA = amount * (percentageA / 100);
      }

      const shareB = amount - shareA;

      if (expense.paidBy === "A") {
        paidByA += amount;
      } else {
        paidByB += amount;
      }

      owedByA += shareA;
      owedByB += shareB;
    });

    return {
      A: {
        paid: paidByA,
        owed: owedByA,
        net: paidByA - owedByA,
      },
      B: {
        paid: paidByB,
        owed: owedByB,
        net: paidByB - owedByB,
      },
    };
  }, [expenses, profiles]);

  // Total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return {
    balance,
    settlementText,
    settlementAmount,
    contributions,
    totalExpenses,
  };
}
