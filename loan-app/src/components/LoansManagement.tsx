import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../src/utils/supabaseClient';
import type { Loan, RepaymentSchedule } from '../types/loan';
import { formatCurrency } from '../utils/loanCalculations';

type PaymentStatus =
  | "paid"
  | "late"
  | "due_today"
  | "overdue"
  | "unpaid";


interface LoansManagementProps {
  onCreateNewLoan: () => void;
}

function getPaymentStatusStyle( status?: PaymentStatus
) {
  switch (status) {
    case "paid":
      return "border-green-500";
    case "late":
      return "border-yellow-500";
    case "due_today":
      return "border-blue-500";
    case "overdue":
      return "border-red-500";
    case "unpaid":
      return "border-gray-400";
    default:
      return "border-gray-200";
  }
}



const LoansManagement: React.FC<LoansManagementProps> = ({ onCreateNewLoan }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RepaymentSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // -- Load current authenticated user (no re-login) --
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.warn("No authenticated user found.");
        setAdminEmail(null);
        return;
      }

      setAdminEmail(data.user.email ?? null);
      console.log("Authenticated user:", data.user.email);
    };

    void loadUser();
  }, []);

  // Fetch loans with debtor + creditor in one query
  const fetchLoans = useCallback(async () => {
    setLoadingLoans(true);

    try {
      // 1. Fetch loans + debtor only
      const { data: loanRows, error: loanErr } = await supabase
        .from("loans")
        .select(`
          *,
          debtors(*)
        `)
        .order("loan_id", { ascending: true });

      if (loanErr) throw loanErr;

      // 2. Fetch allocations (multi-creditor)
      const { data: allocRows, error: allocErr } = await supabase
        .from("loan_allocations")
        .select(`
          loan_id,
          amount_allocated,
          creditors(*)
        `);

      if (allocErr) throw allocErr;

      // 3. Fetch SINGLE creditors for legacy loans
      const { data: singleCredRows } = await supabase
        .from("creditors")
        .select("*");

      const singleCredMap: Record<number, any> = {};
      singleCredRows?.forEach(c => {
        singleCredMap[c.creditor_id] = c;
      });

      // 4. Group allocations per loan
      const allocMap: Record<number, any[]> = {};
      allocRows?.forEach(row => {
        if (!allocMap[row.loan_id]) allocMap[row.loan_id] = [];
        allocMap[row.loan_id].push({
          amount_allocated: row.amount_allocated,
          ...row.creditors
        });
      });

      // 5. FINAL — Build Loan objects cleanly
      const mapped: Loan[] = (loanRows ?? []).map((loan: any) => ({
        loan_id: loan.loan_id,
        debtor_id: loan.debtor_id,
        creditor_id: loan.creditor_id, // legacy
        principal_amount: loan.principal_amount,
        date_released: loan.date_released,
        interest_rate_monthly: loan.interest_rate_monthly,
        loan_term_months: loan.loan_term_months,
        frequency_of_collection: loan.frequency_of_collection,
        start_date: loan.start_date,
        status: loan.status,
        debtor: loan.debtors,

        // multi-creditor list
        creditors: allocMap[loan.loan_id] ?? [],

        // legacy single creditor
        creditor: singleCredMap[loan.creditor_id] ?? null,

        // alias for table rendering (optional)
        allocations: allocMap[loan.loan_id] ?? []
      }));

      setLoans(mapped);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      alert(err.message ?? String(err));
    } finally {
      setLoadingLoans(false);
    }
  }, []);

  useEffect(() => {
    void fetchLoans();
  }, [fetchLoans]);

  // Derived / filtered loans
  const filteredLoans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return loans.filter((loan) => {
      const debtorName = loan.debtor?.name?.toLowerCase() ?? '';
      const creditorFirst = loan.creditor?.first_name?.toLowerCase() ?? '';
      const creditorLast = loan.creditor?.last_name?.toLowerCase() ?? '';

      const matchesSearch =
        !term ||
        debtorName.includes(term) ||
        creditorFirst.includes(term) ||
        creditorLast.includes(term) ||
        loan.loan_id.toString().includes(term);

      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ongoing':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'Completed':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
      case 'Defaulted':
        return 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 border-rose-300';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300';
      case 'weekly':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300';
      case 'monthly':
        return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300';
    }
  };

  // View loan details
  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  // Fetch schedule on demand
 const handleViewSchedule = async (loan: Loan) => {
  setSelectedLoan(loan);
  setShowSchedule(true);
  setLoadingSchedule(true);
  setSelectedSchedule([]);

  try {
    // 1. Fetch repayment schedule
    const { data: schedules, error: schedErr } = await supabase
      .from("repayment_schedule")
      .select("*")
      .eq("loan_id", loan.loan_id)
      .order("payment_no", { ascending: true });

    if (schedErr) throw schedErr;

    // 2. Fetch payments for this loan
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("schedule_id, amount_paid, payment_date")
      .eq("loan_id", loan.loan_id);

    if (payErr) throw payErr;

    // 3. Group payments by schedule_id
    const paymentMap = new Map<number, {
      totalPaid: number;
      paidDate: string | null;
    }>();

    (payments ?? []).forEach((p: any) => {
      const prev = paymentMap.get(p.schedule_id) ?? {
        totalPaid: 0,
        paidDate: null,
      };

      const latestDate =
        !prev.paidDate || p.payment_date > prev.paidDate
          ? p.payment_date
          : prev.paidDate;

      paymentMap.set(p.schedule_id, {
        totalPaid: prev.totalPaid + Number(p.amount_paid),
        paidDate: latestDate,
      });
    });

    // 4. Merge + derive status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const merged = (schedules ?? []).map((s: any) => {
      const payment = paymentMap.get(s.schedule_id);
      const totalPaid = payment?.totalPaid ?? 0;
      const paidDate = payment?.paidDate ?? null;

      const amort = Number(s.amortization);

      const dueDate = new Date(s.due_date);
      dueDate.setHours(0, 0, 0, 0);

      let payment_status: PaymentStatus = "unpaid";

      if (totalPaid >= amort) {
        payment_status =
          paidDate && new Date(paidDate) > dueDate ? "late" : "paid";
      } else if (dueDate.getTime() === today.getTime()) {
        payment_status = "due_today";
      } else if (today > dueDate) {
        payment_status = "overdue";
      }

      return {
        ...s,
        amortization: Number(s.amortization),
        principal: Number(s.principal),
        interest: Number(s.interest),
        balance: Number(s.balance),
        total_paid: totalPaid,
        paid_date: paidDate,
        payment_status,
      };
    });


    setSelectedSchedule(merged);
  } catch (err: any) {
    console.error("Schedule error:", err);
    alert(err.message ?? String(err));
    setShowSchedule(false);
  } finally {
    setLoadingSchedule(false);
  }
};


  // Verify password for currently logged-in user using the /auth/v1/verify endpoint.
  // This avoids calling signInWithPassword when already authenticated.
const verifyCurrentUserPassword = async (password: string) => {
  try {
    // get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.email) {
      return { ok: false, message: "Not authenticated" };
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing env vars");
      return { ok: false, message: "Configuration error" };
    }

    // 🔥 Call password grant — this does NOT replace the current session
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.user.email,
          password,
        }),
      }
    );

    if (!res.ok) {
      return { ok: false, message: "Incorrect password" };
    }

    // Password is valid!
    return { ok: true };
  } catch (err: any) {
    console.error("verifyCurrentUserPassword error:", err);
    return { ok: false, message: err?.message ?? "Unknown error" };
  }
};



  // Delete loan (optimistic)
  const handleDeleteLoan = async (loanId: number) => {

    const previous = loans;
    setLoans((cur) => cur.filter((l) => l.loan_id !== loanId));

    try {
      // call RPC instead of direct delete
      const { error } = await supabase.rpc("delete_loan_fully", {
        p_loan_id: loanId,
      });

      if (error) throw error;

      await fetchLoans();
    } catch (err: any) {
      console.error("Delete loan failed:", err);
      alert(`Failed to delete loan: ${err.message ?? err}`);
      setLoans(previous);
    } finally {
    }
  };

  // Called when user confirms deletion in modal
  const confirmDeleteClick = async () => {
    setDeleteError(null);

    if (!loanToDelete) return;

    // ensure we have an authenticated user
    if (!adminEmail) {
      setDeleteError("No authenticated admin found.");
      return;
    }

    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }

    // Verify password using current session
    const result = await verifyCurrentUserPassword(deletePassword);

    if (!result.ok) {
      setDeleteError(result.message ?? "Incorrect password.");
      return;
    }

    // password OK -> proceed to delete
    setShowDeleteModal(false);
    setDeletePassword("");
    await handleDeleteLoan(loanToDelete.loan_id);
    setLoanToDelete(null);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">Loans Management</h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">Manage all loans, track their status, and monitor portfolio performance</p>
            </div>
            <button
              onClick={onCreateNewLoan}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Loan
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search loans by name, creditor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Defaulted">Defaulted</option>
              </select>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm text-slate-500 bg-white/60 px-4 py-2 rounded-lg border border-slate-200">{loadingLoans ? 'Loading...' : `Showing ${filteredLoans.length} of ${loans.length} loans`}</span>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Debtor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Creditor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Interest Rate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200">
                {loadingLoans ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">Loading loans...</td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">No loans found.</td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.loan_id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200">#{loan.loan_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">{loan.debtor?.name?.charAt(0) ?? '-'}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{loan.debtor?.name ?? '—'}</div>
                            <div className="text-sm text-slate-500">{loan.debtor?.contact_info ?? ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const multi = (loan as any).creditors ?? [];

                          // Case 1: multi-creditor loans
                          if (multi.length > 0) {
                            return (
                              <div className="space-y-1">
                                {multi.map((c: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500/80 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {c.first_name?.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-semibold">{c.first_name} {c.last_name}</div>
                                      <div className="text-xs text-slate-500">
                                        Allocated: {formatCurrency(c.amount_allocated)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          // Case 2: single creditor (old loans)
                          if (loan.creditor) {
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500/80 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {loan.creditor.first_name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold">{loan.creditor.first_name} {loan.creditor.last_name}</div>
                                  <div className="text-xs text-slate-500">{loan.creditor.email}</div>
                                </div>
                              </div>
                            );
                          }

                          // Case 3: no creditor at all
                          return <div className="text-sm text-slate-500">-</div>;
                        })()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{formatCurrency(loan.principal_amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">{loan.interest_rate_monthly}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{loan.loan_term_months} months</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getFrequencyColor(loan.frequency_of_collection)}`}>{loan.frequency_of_collection}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(loan.status)}`}>{loan.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button onClick={() => handleViewLoan(loan)} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200" title="View Details"><EyeIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleViewSchedule(loan)} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200" title="View Schedule"><CalendarIcon className="w-4 h-4" /></button>
                          <button
                            onClick={() => {
                              setLoanToDelete(loan);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                            title="Delete Loan"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loan Details Modal */}
        {showModal && selectedLoan && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Loan Details - #{selectedLoan.loan_id}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center"><div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>Loan Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Principal Amount:</span><span className="font-semibold text-slate-900">{formatCurrency(selectedLoan.principal_amount)}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Interest Rate:</span><span className="font-semibold text-slate-900">{selectedLoan.interest_rate_monthly}%</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Loan Term:</span><span className="font-semibold text-slate-900">{selectedLoan.loan_term_months} months</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Collection Frequency:</span><span className="font-semibold text-slate-900 capitalize">{selectedLoan.frequency_of_collection}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Date Released:</span><span className="font-semibold text-slate-900">{new Date(selectedLoan.date_released).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Status:</span><span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center"><div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>Debtor Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Name:</span><span className="font-semibold text-slate-900">{selectedLoan.debtor?.name}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Contact:</span><span className="font-semibold text-slate-900">{selectedLoan.debtor?.contact_info}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Address:</span><span className="font-semibold text-slate-900">{selectedLoan.debtor?.address}</span></div>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-4 text-lg mt-8 flex items-center"><div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mr-3"></div>Creditor Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Name:</span><span className="font-semibold text-slate-900">{selectedLoan.creditor?.first_name} {selectedLoan.creditor?.last_name}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Email:</span><span className="font-semibold text-slate-900">{selectedLoan.creditor?.email}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Phone:</span><span className="font-semibold text-slate-900">{selectedLoan.creditor?.phone}</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Close</button>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">Edit Loan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repayment Schedule Modal */}
        {showSchedule && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Repayment Schedule</h3>
                  <button onClick={() => setShowSchedule(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-900 flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />Payment Schedule</h4>
                    <p className="text-sm text-slate-600 mt-1">{loadingSchedule ? 'Loading schedule...' : `${selectedSchedule.length} payments scheduled`}</p>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/80 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment #</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount Due</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Principal</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Remaining Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 divide-y divide-slate-200">
                        {loadingSchedule ? (
                          <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading schedule...</td></tr>
                        ) : selectedSchedule.length === 0 ? (
                          <tr><td colSpan={6} className="p-6 text-center text-slate-500">No schedule found for this loan.</td></tr>
                        ) : (
                          selectedSchedule.map((payment) => (
                            <tr
                              key={`${payment.schedule_id}-${payment.payment_no}`}
                              className="transition-colors duration-150 hover:bg-slate-50/80"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200">
                                  #{payment.payment_no}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CalendarIcon className="w-4 h-4 text-slate-400 mr-2" />
                                  <span className="text-sm font-medium text-slate-900">
                                    {new Date(payment.due_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-slate-900">
                                  {formatCurrency(payment.amortization)}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {formatCurrency(payment.principal)}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {formatCurrency(payment.interest)}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {formatCurrency(payment.balance)}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                title={
                                  payment.paid_date
                                    ? `Paid on ${new Date(payment.paid_date).toLocaleDateString()}`
                                    : payment.payment_status === "overdue"
                                    ? "Payment overdue"
                                    : "Not yet paid"
                                }
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusStyle(payment.payment_status)}`}
                              >
                                {payment.payment_status === "due_today"
                                  ? "DUE TODAY":
                                  payment.payment_status === "late" 
                                  ? "PAID LATE":
                                   payment.payment_status?.toUpperCase() ?? "—"}
                              </span>
                            </td>

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-600">Total Payments:</span><span className="font-semibold text-slate-900">{selectedSchedule.length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-600">Total Amount:</span><span className="font-semibold text-slate-900">{formatCurrency(selectedSchedule.reduce((sum, p) => sum + p.amortization, 0))}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-600">Next Payment:</span><span className="font-semibold text-slate-900">{selectedSchedule.length > 0 ? new Date(selectedSchedule[0].due_date).toLocaleDateString() : 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end"><button onClick={() => setShowSchedule(false)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Close</button></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && loanToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white shadow-2xl rounded-2xl w-96 p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Confirm Delete Loan #{loanToDelete.loan_id}
            </h2>

            <p className="text-slate-600 text-sm mb-4">
              To confirm, please enter your password.
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError(null);
              }}
              placeholder="Enter your admin password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />

            {deleteError && (
              <p className="text-sm text-rose-600 mt-2">{deleteError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await confirmDeleteClick();
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansManagement;
