// src/services/debtorsService.ts
import { supabase } from '../../src/utils/supabaseClient';
import type { Debtor, Loan } from '../types/loan';
import type { PostgrestError } from '@supabase/supabase-js';

export interface DebtorStat extends Debtor {
  total_borrowed: number;
  active_loans: number;
  total_loans: number;
}

/** Fetch aggregated debtors from the debtor_stats view */
export const fetchDebtorsWithStats = async (): Promise<{ data: DebtorStat[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase.from('debtor_stats').select('*').order('debtor_id', { ascending: true });
  if (error) return { data: null, error };
  const mapped = (data as any[]).map((r) => ({
    debtor_id: Number(r.debtor_id),
    name: r.name,
    contact_info: r.contact_info,
    address: r.address,
    total_borrowed: Number(r.total_borrowed ?? 0),
    active_loans: Number(r.active_loans ?? 0),
    total_loans: Number(r.total_loans ?? 0),
  })) as DebtorStat[];

  return { data: mapped, error: null };
};

/** Fetch loans for a given debtor (includes debtor/creditor join if needed) */
export const fetchLoansByDebtor = async (debtor_id: number) => {
  const { data, error } = await supabase
    .from("loans")
    .select(`
      *,
      creditors(*),
      loan_creditor_allocations(
        amount_allocated,
        creditors(*)
      )
    `)
    .eq("debtor_id", debtor_id)
    .order("loan_id", { ascending: true });

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

    debtor: null, // no need

    // single legacy creditor
    creditor: r.creditors ?? null,

    // multi creditor allocations
    allocations: r.loan_creditor_allocations ?? []
  }));

  return { data: mapped as Loan[], error: null };
};


/** Create debtor */
export const createDebtor = async (payload: Omit<Debtor, 'debtor_id'>) => {
  const { data, error } = await supabase.from('debtors').insert([payload]).select('*').single();
  return { data, error };
};

/** Update debtor */
export const updateDebtor = async (debtor_id: number, payload: Partial<Debtor>) => {
  const { data, error } = await supabase.from('debtors').update(payload).eq('debtor_id', debtor_id).select('*').single();
  return { data, error };
};

/** Delete debtor -- be careful with FK constraints (loans pointing to debtor). */
export const deleteDebtor = async (debtor_id: number) => {
  const { data, error } = await supabase.from('debtors').delete().eq('debtor_id', debtor_id);
  return { data, error };
};


export const addDebtor = async (debtor: {
  name: string;
  contact_info?: string;
  address?: string;
}) => {
  const { data, error } = await supabase
    .from("debtors")
    .insert(debtor)
    .select("debtor_id")
    .single();

  if (error) throw error;
  return data.debtor_id;
};

export const fetchDebtors = async () => {
  const { data, error } = await supabase
    .from("debtors")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};