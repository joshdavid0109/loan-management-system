import { supabase } from './supabaseClient';
import type { LoanCalculation, RepaymentSchedule } from '../types/loan';

export interface CreateLoanInput {
  debtor_id: number;

  // NEW: list of creditor allocations
  allocations: Array<{
    creditor_id: number;
    amount_allocated: number;
  }>;

  principal_amount: number;
  date_released: string;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency_of_collection: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  calculation: LoanCalculation;
}

let savingLock = false;

export const saveLoanWithSchedule = async (input: CreateLoanInput) => {
  if (savingLock) {
    console.warn("Duplicate save blocked");
    return;
  }
  savingLock = true;

  try {
    const payload = {
      debtor_id: input.debtor_id,
      principal_amount: input.principal_amount,
      date_released: input.date_released,
      interest_rate_monthly: input.interest_rate_monthly,
      loan_term_months: input.loan_term_months,
      frequency_of_collection: input.frequency_of_collection,
      start_date: input.start_date,

      schedule: input.calculation.amortization_schedule.map((s) => ({
        payment_no: s.payment_no,
        due_date: s.due_date,
        amortization: s.amortization,
        principal: s.principal,
        interest: s.interest,
        balance: s.balance,
      })),

      allocations: input.allocations.map((a) => ({
        creditor_id: a.creditor_id,
        amount_allocated: a.amount_allocated,
      })),
    };

    const { data, error } = await supabase.rpc(
      "create_loan_with_schedule",
      { p_payload: payload }
    );

    if (error) throw error;

    return data; // new loan_id

  } finally {
    savingLock = false;
  }
};
