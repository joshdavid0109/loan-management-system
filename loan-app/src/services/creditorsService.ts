// src/services/creditorsService.ts
import { supabase } from '../../src/utils/supabaseClient';
import type { Creditor, Loan } from '../types/loan';
import type { PostgrestError } from '@supabase/supabase-js';

export interface CreditorStat extends Creditor {
  total_lent: number;
  active_loans: number;
  completed_loans: number;
  total_loans: number;
  available: number;

  expected_returns: number;
  expected_interest: number;
}


/**
 * Fetch creditors with precomputed aggregates from `creditor_stats` view.
 */
export const fetchCreditorsWithStats = async (): Promise<{
  data: CreditorStat[] | null;
  error: PostgrestError | null;
}> => {
  const { data, error } = await supabase
    .from('creditor_stats')
    .select('*')
    .order('creditor_id', { ascending: true });

  if (error) return { data: null, error };

  const mapped = (data as any[]).map((r) => ({
    creditor_id: Number(r.creditor_id),
    first_name: r.first_name,
    last_name: r.last_name,
    gender: r.gender,
    phone: r.phone,
    email: r.email,
    address: r.address,

    total_capital: Number(r.total_capital ?? 0),
    total_lent: Number(r.total_lent ?? 0),
    available: Number(r.available ?? 0),

    active_loans: Number(r.active_loans ?? 0),
    completed_loans: Number(r.completed_loans ?? 0),
    total_loans: Number(r.total_loans ?? 0),

    // ✅ MUST MATCH VIEW NAMES
    expected_returns: Number(r.expected_returns ?? 0),
    expected_interest: Number(r.expected_interest ?? 0),
  }));

  return { data: mapped, error: null };
};



/**
 * Fetch loans for a given creditor_id
 */
export const fetchLoansByCreditor = async (
  creditor_id: number
): Promise<{ data: Loan[] | null; error: PostgrestError | null }> => {

  const { data, error } = await supabase
  .from('loan_allocations')
  .select(`
    allocation_id,
    loan_id,
    amount_allocated,

    loan:loans (
      loan_id,
      debtor_id,
      principal_amount,
      interest_rate_monthly,
      loan_term_months,
      frequency_of_collection,
      date_released,
      start_date,
      status,

      debtor:debtors (
        debtor_id,
        name,
        contact_info,
        address
      ),

      allocations:loan_allocations (
        creditor_id
      )
    )
  `)
  .eq('creditor_id', creditor_id);


  if (error) return { data: null, error };

  const mapped = (data || []).map((row: any) => {
    const principal = Number(row.loan.principal_amount);
    const allocated = Number(row.amount_allocated);

    const interestRate = Number(row.loan.interest_rate_monthly);
    const months = Number(row.loan.loan_term_months);

    // simple interest model (adjust if you compound)
    const totalInterest = principal * (interestRate / 100) * months;

    const shareRatio = allocated / principal;

    const amountToBeReturned =
      allocated + totalInterest * shareRatio;

    const isSharedLoan = (row.loan.allocations?.length ?? 0) > 1;

    return {
      loan_id: row.loan.loan_id,
      debtor_id: row.loan.debtor_id,
      creditor_id,

      principal_amount: principal,
      interest_rate_monthly: interestRate,
      loan_term_months: months,
      frequency_of_collection: row.loan.frequency_of_collection,
      date_released: row.loan.date_released,
      start_date: row.loan.start_date,
      status: row.loan.status,

      debtor: row.loan.debtor ?? null,
      creditor: undefined,

      amount_allocated: allocated,
      amount_to_be_returned: Number(amountToBeReturned.toFixed(2)),
      is_allocated: true,
      is_shared_loan: isSharedLoan
    };
  }) as Loan[];

  return { data: mapped, error: null };
};



/**
 * Create a creditor
 */
export const createCreditor = async (payload: Omit<Creditor, 'creditor_id'>) => {
  const { data, error } = await supabase.from('creditors').insert([payload]).select('*').single();
  return { data, error };
};

/**
 * Update a creditor
 */
export const updateCreditor = async (creditor_id: number, payload: Partial<Creditor>) => {
  const { data, error } = await supabase.from('creditors').update(payload).eq('creditor_id', creditor_id).select('*').single();
  return { data, error };
};

/**
 * Delete a creditor
 * Note: this will fail if FK constraints exist unless you cascade. Make sure this is desired.
 */
export const deleteCreditor = async (creditor_id: number) => {
  const { data, error } = await supabase.from('creditors').delete().eq('creditor_id', creditor_id);
  return { data, error };
};
