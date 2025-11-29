// src/services/creditorsService.ts
import { supabase } from '../../src/utils/supabaseClient';
import type { Creditor, Loan } from '../types/loan';
import type { PostgrestError } from '@supabase/supabase-js';

export interface CreditorStat extends Creditor {
  total_lent: number;
  active_loans: number;
  completed_loans: number;
  total_loans: number;
}

/**
 * Fetch creditors with precomputed aggregates from `creditor_stats` view.
 */
export const fetchCreditorsWithStats = async (): Promise<{ data: CreditorStat[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase.from('creditor_stats').select('*').order('creditor_id', { ascending: true });
  if (error) return { data: null, error };
  // cast numeric strings (Postgres returns numeric as strings) to numbers for certain fields
  const mapped = (data as any[]).map((r) => ({
  creditor_id: Number(r.creditor_id),
  first_name: r.first_name,
  last_name: r.last_name,
  gender: r.gender,
  phone: r.phone,
  email: r.email,
  address: r.address,

  // IMPORTANT: include these missing ones
  capital: Number(r.capital ?? 0),
  total_capital: Number(r.total_capital ?? 0),
  available: Number(r.available ?? 0),

  total_lent: Number(r.total_lent ?? 0),
  active_loans: Number(r.active_loans ?? 0),
  completed_loans: Number(r.completed_loans ?? 0),
  total_loans: Number(r.total_loans ?? 0),
}));

  return { data: mapped, error: null };
};

/**
 * Fetch loans for a given creditor_id
 */
export const fetchLoansByCreditor = async (
  creditor_id: number
): Promise<{ data: Loan[] | null; error: PostgrestError | null }> => {

  // -------------------------
  // A) LOANS WHERE CREDITOR IS PRIMARY (loans.creditor_id)
  // -------------------------
  const direct = await supabase
    .from('loans')
    .select(`
      loan_id,
      debtor_id,
      creditor_id,
      principal_amount,
      date_released,
      interest_rate_monthly,
      loan_term_months,
      frequency_of_collection,
      start_date,
      status,
      debtors(*)
    `)
    .eq('creditor_id', creditor_id)
    .order('loan_id', { ascending: true });

  if (direct.error) return { data: null, error: direct.error };

  const directMapped = (direct.data || []).map((r: any) => ({
    loan_id: r.loan_id,
    debtor_id: r.debtor_id,
    creditor_id: r.creditor_id,
    principal_amount: Number(r.principal_amount),
    date_released: r.date_released,
    interest_rate_monthly: Number(r.interest_rate_monthly),
    loan_term_months: Number(r.loan_term_months),
    frequency_of_collection: r.frequency_of_collection,
    start_date: r.start_date,
    status: r.status,
    debtor: r.debtors ?? null,
    creditor: undefined,

    // Full owner → no allocation
    amount_allocated: Number(r.principal_amount)
  })) as Loan[];


  // -------------------------
  // B) LOANS WHERE CREDITOR IS AN ALLOCATOR (loan_creditor_allocations)
  // -------------------------
  const alloc = await supabase
    .from('loan_creditor_allocations')
    .select(`
      allocation_id,
      amount_allocated,
      loans:loans (
        loan_id,
        debtor_id,
        creditor_id,
        principal_amount,
        date_released,
        interest_rate_monthly,
        loan_term_months,
        frequency_of_collection,
        start_date,
        status,
        debtors(*)
      )
    `)
    .eq('creditor_id', creditor_id)
    .order('allocation_id', { ascending: true });

  if (alloc.error) return { data: null, error: alloc.error };

  const allocMapped = (alloc.data || []).map((row: any) => ({
    loan_id: row.loans.loan_id,
    debtor_id: row.loans.debtor_id,
    creditor_id: row.loans.creditor_id,
    principal_amount: Number(row.loans.principal_amount),
    date_released: row.loans.date_released,
    interest_rate_monthly: Number(row.loans.interest_rate_monthly),
    loan_term_months: Number(row.loans.loan_term_months),
    frequency_of_collection: row.loans.frequency_of_collection,
    start_date: row.loans.start_date,
    status: row.loans.status,
    debtor: row.loans.debtors ?? null,
    creditor: undefined,

    // Allocated loan → use allocated amount
    amount_allocated: Number(row.amount_allocated)
  })) as Loan[];


  // -------------------------
  // MERGE A + B AND REMOVE DUPLICATES
  // -------------------------
  const combined = [...directMapped];

  allocMapped.forEach((a) => {
    if (!combined.some((d) => d.loan_id === a.loan_id)) {
      combined.push(a);
    }
  });

  return { data: combined, error: null };
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
