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
    total_lent: Number(r.total_lent ?? 0),
    active_loans: Number(r.active_loans ?? 0),
    completed_loans: Number(r.completed_loans ?? 0),
    total_loans: Number(r.total_loans ?? 0),
  })) as CreditorStat[];

  return { data: mapped, error: null };
};

/**
 * Fetch loans for a given creditor_id
 */
export const fetchLoansByCreditor = async (creditor_id: number): Promise<{ data: Loan[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('loans')
    .select('*, debtors(*)') // include debtor details for display
    .eq('creditor_id', creditor_id)
    .order('loan_id', { ascending: true });

  if (error) return { data: null, error };

    const mapped = (data || []).map((r: any) => ({
        loan_id: Number(r.loan_id),
        debtor_id: Number(r.debtor_id),
        creditor_id: Number(r.creditor_id),

        principal_amount: Number(r.principal_amount),
        date_released: r.date_released,

        interest_rate_monthly: Number(r.interest_rate_monthly),
        loan_term_months: Number(r.loan_term_months),

        frequency_of_collection: r.frequency_of_collection,
        start_date: r.start_date,

        status: r.status,

        debtor: r.debtors ?? undefined,
        creditor: undefined
    })) as Loan[];


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
