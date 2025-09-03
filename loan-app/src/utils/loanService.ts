import { supabase } from './supabaseClient';
import type { LoanCalculation, RepaymentSchedule } from '../types/loan';

export interface CreateLoanInput {
  debtor_id: number;
  creditor_id: number;
  principal_amount: number;
  date_released: string; // YYYY-MM-DD
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency_of_collection: 'daily' | 'weekly' | 'monthly';
  start_date: string; // YYYY-MM-DD
  calculation: LoanCalculation;
}

export const saveLoanWithSchedule = async (input: CreateLoanInput) => {
  // 1) Insert loan
  const { data: loanInsert, error: loanError } = await supabase
    .from('loans')
    .insert([
      {
        debtor_id: input.debtor_id,
        creditor_id: input.creditor_id,
        principal_amount: input.principal_amount,
        date_released: input.date_released,
        interest_rate_monthly: input.interest_rate_monthly,
        loan_term_months: input.loan_term_months,
        frequency_of_collection: input.frequency_of_collection,
        start_date: input.start_date,
        status: 'Ongoing',
      },
    ])
    .select('loan_id')
    .single();

  if (loanError) throw loanError;
  const loanId = loanInsert.loan_id as number;

  // 2) Insert schedule
  const scheduleRows = input.calculation.amortization_schedule.map((row: RepaymentSchedule) => ({
    loan_id: loanId,
    payment_no: row.payment_no,
    due_date: row.due_date,
    amortization: row.amortization,
    principal: row.principal,
    interest: row.interest,
    balance: row.balance,
  }));

  const { error: schedError } = await supabase
    .from('repayment_schedule')
    .insert(scheduleRows);

  if (schedError) throw schedError;

  return loanId;
};


