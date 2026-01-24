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
/** Fetch loans for a given debtor */
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

  const mapped: Loan[] = (data ?? []).map((r: any) => {
    const allocations =
      (r.loan_creditor_allocations ?? []).map((a: any) => ({
        amount_allocated: Number(a.amount_allocated),
        ...a.creditors,
      }));

    const totalAllocated = allocations.reduce(
      (sum: number, a: any) => sum + Number(a.amount_allocated),
      0
    );

    return {
      loan_id: Number(r.loan_id),
      debtor_id: Number(r.debtor_id),
      creditor_id: r.creditor_id ? Number(r.creditor_id) : null,

      principal_amount: Number(r.principal_amount),
      date_released: r.date_released,
      interest_rate_monthly: Number(r.interest_rate_monthly),
      loan_term_months: Number(r.loan_term_months),
      frequency_of_collection: r.frequency_of_collection,
      start_date: r.start_date,
      status: r.status,

      debtor: null, // intentionally omitted here

      // legacy single creditor
      creditor: r.creditors ?? null,

      // multi-creditor
      allocations,
      creditors: allocations,

      // ✅ derived fields (THIS FIXES TS)
      amount_allocated: totalAllocated,
      amount_to_be_returned:
        Number(r.total_to_be_paid) ??
        Number(r.principal_amount) *
          (1 +
            (Number(r.interest_rate_monthly) / 100) *
              Number(r.loan_term_months)),

      is_allocated: totalAllocated > 0,
      is_shared_loan: allocations.length > 1,
    };
  });

  return { data: mapped, error: null };
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