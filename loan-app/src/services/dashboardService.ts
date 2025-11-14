// src/services/dashboardService.ts
import { supabase } from '../../src/utils/supabaseClient';
import type { Loan, DashboardStats } from '../types/loan';

/**
 * Helper: safe number conversion
 */
const toNumber = (v: any) => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Fetch loans (joined with debtors and creditors) — used by multiple endpoints.
 * Limit param optional; for recent activity we use small limit.
 */
export const fetchLoans = async (limit = 1000) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*, debtors(*), creditors(*)')
    .order('loan_id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((r: any) => ({
    loan_id: Number(r.loan_id),
    debtor_id: Number(r.debtor_id),
    creditor_id: Number(r.creditor_id),
    principal_amount: toNumber(r.principal_amount),
    date_released: r.date_released,
    interest_rate_monthly: toNumber(r.interest_rate_monthly),
    loan_term_months: toNumber(r.loan_term_months),
    frequency_of_collection: r.frequency_of_collection,
    start_date: r.start_date,
    status: r.status,
    debtor: r.debtors ?? undefined,
    creditor: r.creditors ?? undefined,
  })) as Loan[];
};

/**
 * Attempt to fetch payments for the last 12 months (if payments table exists).
 * If payments table does not exist (error), this returns null so caller can fallback.
 */
export const fetchPayments = async () => {
  try {
    // Load last 24 months to be safe then aggregate
    const { data, error } = await supabase
      .from('payments')
      .select('payment_id, loan_id, payment_date, amount_paid')
      .order('payment_date', { ascending: false })
      .limit(10000);

    if (error) {
      // If payments table truly does not exist, Supabase returns an error — caller will handle fallback
      throw error;
    }
    return data || [];
  } catch (err) {
    // propagate as null so caller knows to fallback
    return null;
  }
};

/**
 * Compute dashboard aggregates (returns DashboardStats)
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Fetch loans (all or up to some limit). If very large dataset use server-side aggregates (see notes).
  const loans = await fetchLoans(2000);

  const total_loans = loans.length;
  const active_loans = loans.filter((l) => l.status === 'Ongoing').length;
  const completed_loans = loans.filter((l) => l.status === 'Completed').length;
  const defaulted_loans = loans.filter((l) => l.status === 'Defaulted').length;

  // Outstanding: sum of principal for loans not completed (business rule; adjust if you track remaining balance in schedule/payments)
  const total_outstanding = loans
    .filter((l) => l.status !== 'Completed')
    .reduce((s, l) => s + (l.principal_amount || 0), 0);

  // Total collected: sum of principal for completed loans (approximation). If you track payments, use those.
  const total_collected = loans
    .filter((l) => l.status === 'Completed')
    .reduce((s, l) => s + (l.principal_amount || 0), 0);

  // Monthly collection: attempt to compute using payments table (preferred)
  let monthly_collection = 0;
  const payments = await fetchPayments();
  if (payments === null) {
    // fallback: approximate as total_collected / 12 (simple heuristic)
    monthly_collection = Math.round((total_collected / 12) * 100) / 100;
  } else {
    // Sum payments in current month
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthly_collection = (payments || [])
      .filter((p: any) => {
        const d = new Date(p.payment_date);
        return d >= first && d < next;
      })
      .reduce((s: number, p: any) => s + toNumber(p.amount_paid), 0);
  }

  return {
    total_loans,
    active_loans,
    completed_loans,
    defaulted_loans,
    total_outstanding,
    total_collected,
    monthly_collection,
  };
};

/**
 * Returns monthly collection series for last N months (default 6 or 12).
 * If payments table is present, uses payments; otherwise falls back to grouping loan releases.
 */
export const fetchMonthlyCollections = async (months = 6) => {
  const payments = await fetchPayments();
  const now = new Date();
  const series: { name: string; amount: number }[] = [];

  // create months array (oldest -> newest)
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    series.push({ name: label, amount: 0 });
  }

  if (payments === null) {
    // fallback: use loan.date_released amounts (approximate)
    const loans = await fetchLoans(5000);
    loans.forEach((l) => {
      if (!l.date_released) return;
      const d = new Date(l.date_released);
      const label = d.toLocaleString('default', { month: 'short' });
      const idx = series.findIndex((s) => s.name === label);
      if (idx >= 0) series[idx].amount += l.principal_amount || 0;
    });
  } else {
    // aggregate payments into months
    (payments || []).forEach((p: any) => {
      const d = new Date(p.payment_date);
      const label = d.toLocaleString('default', { month: 'short' });
      const idx = series.findIndex((s) => s.name === label);
      if (idx >= 0) series[idx].amount += toNumber(p.amount_paid);
    });
  }

  // round amounts
  return series.map((s) => ({ name: s.name, amount: Math.round(s.amount * 100) / 100 }));
};

/**
 * Get loan status counts for pie chart
 */
export const fetchLoanStatusCounts = async () => {
  const loans = await fetchLoans(2000);
  const active = loans.filter((l) => l.status === 'Ongoing').length;
  const completed = loans.filter((l) => l.status === 'Completed').length;
  const defaulted = loans.filter((l) => l.status === 'Defaulted').length;
  return { active, completed, defaulted };
};

/**
 * Fetch recent activity — latest loans (with debtor & creditor)
 */
export const fetchRecentLoans = async (limit = 5) => {
  const loans = await fetchLoans(limit);
  // they are already in descending order by loan_id from fetchLoans
  return loans.slice(0, limit);
};
