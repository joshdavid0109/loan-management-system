import { supabase } from '../utils/supabaseClient';

export const fetchAllReportsData = async () => {
  // 1) Fetch all loans
  const { data: loans, error: loanErr } = await supabase
    .from('loans')
    .select(`
      *,
      debtors(*),
      creditors(*)
    `);

  if (loanErr) throw loanErr;

  // 2) Fetch debtors list
  const { data: debtors, error: debtorErr } = await supabase
    .from('debtors')
    .select('*');
  if (debtorErr) throw debtorErr;

  // 3) Fetch creditors list
  const { data: creditors, error: creditorErr } = await supabase
    .from('creditor_stats')
    .select('*');
  if (creditorErr) throw creditorErr;

  // 4) Fetch loan allocations (optional, if needed)
  const { data: allocations, error: allocErr } = await supabase
    .from('loan_creditor_allocations')
    .select('*');
  if (allocErr) throw allocErr;

  return { loans, debtors, creditors, allocations };
};
