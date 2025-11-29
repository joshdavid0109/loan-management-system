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

export const saveLoanWithSchedule = async (input: CreateLoanInput) => {
  if (!supabase) throw new Error("Supabase not configured");

  // 1) Insert loan
  const { data: loanInsert, error: loanError } = await supabase
    .from("loans")
    .insert([
      {
        debtor_id: input.debtor_id,
        principal_amount: input.principal_amount,
        date_released: input.date_released,
        interest_rate_monthly: input.interest_rate_monthly,
        loan_term_months: input.loan_term_months,
        frequency_of_collection: input.frequency_of_collection,
        start_date: input.start_date,
        status: "Ongoing",
      },
    ])
    .select("loan_id")
    .single();

  if (loanError) throw loanError;

  const loanId = loanInsert.loan_id;

  // 2) Insert schedule
  const scheduleRows = input.calculation.amortization_schedule.map((row) => ({
    loan_id: loanId,
    payment_no: row.payment_no,
    due_date: row.due_date,
    amortization: row.amortization,
    principal: row.principal,
    interest: row.interest,
    balance: row.balance,
  }));

  const { error: schedError } = await supabase
    .from("repayment_schedule")
    .insert(scheduleRows);

  if (schedError) throw schedError;

  // 3) Insert allocations
if (input.allocations && input.allocations.length > 0) {
  const rows = input.allocations.map(a => ({
    loan_id: loanId,
    creditor_id: a.creditor_id,
    amount_allocated: Number(a.amount_allocated)
  }));

  const { error: allocError } = await supabase
    .from("loan_creditor_allocations")
    .insert(rows);

  if (allocError) throw allocError;
}


  return loanId;
};
