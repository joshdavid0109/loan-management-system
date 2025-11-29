// src/components/LoanCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { calculateLoan, formatCurrency, formatPercentage } from "../utils/loanCalculations";
import type { LoanCalculation } from "../types/loan";
import type { Allocation } from "../types/loan";
import { saveLoanWithSchedule } from "../utils/loanService";
import { fetchCreditorsWithStats } from "../services/creditorsService";
import { supabase } from '../../src/utils/supabaseClient';
import { addDebtor, fetchDebtors } from "../services/debtorsService";


type LoanFormData = {
  principal: number;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency: "daily" | "weekly" | "monthly";
  start_date: string;
  debtor_id: number;
  date_released: string;
  // NOTE: creditor_id field is not used for allocation when manual allocations are present,
  // but kept for backward compatibility with your default form.
  creditor_id?: number;
};

const LoanCalculator: React.FC = () => {
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);

  const [showDebtorModal, setShowDebtorModal] = useState(false);

  const [newDebtor, setNewDebtor] = useState({
    name: "",
    contact_info: "",
    address: "",
  });

  const [debtors, setDebtors] = useState<
    { debtor_id: number; name: string; contact_info?: string; address?: string }[]
  >([]);



  useEffect(() => {
  (async () => {
    const { data, error } = await supabase
      .from("debtors")
      .select("*")
      .order("debtor_id", { ascending: true });

    if (!error && data) setDebtors(data);
  })();
}, []);


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    defaultValues: {
      principal: 100000,
      interest_rate_monthly: 2.5,
      loan_term_months: 12,
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      date_released: new Date().toISOString().split("T")[0],
      debtor_id: 1,
      creditor_id: 1,
    },
  });

  const watched = watch();

  // creditors loaded from server
  const [creditors, setCreditors] = useState<
    {
      capital: any;
      available: any; creditor_id: number; first_name: string; last_name: string; total_lent?: number
}[]
  >([]);

  useEffect(() => {
  console.log("RAW CREDITORS FROM SUPABASE:", creditors);
}, [creditors]);


  // allocations typed properly to avoid TS indexing errors
  const [allocations, setAllocations] = useState<Allocation[]>(
    [{ creditor_id: Number(watched.creditor_id ?? 1), amount_allocated: Number(watched.principal ?? 0) }]
  );

  const [allocError, setAllocError] = useState<string | null>(null);

  // load creditors once
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await fetchCreditorsWithStats();
        if (error) {
          console.error("Failed to fetch creditors", error);
          return;
        }
        if (data) {
          setCreditors(data);
          // if allocations has a placeholder with creditor 1 and we have a real list, use the first creditor id
          setAllocations((prev) => {
            if (!prev || prev.length === 0) return [{
              creditor_id: data[0]?.creditor_id ?? 1,
              amount_allocated: Number(watched.principal ?? 0)
            }];
            // update any 0/undefined creditor_id to first available creditor
            return prev.map((p) => ({
              ...p,
              creditor_id: p.creditor_id && p.creditor_id > 0 ? p.creditor_id : data[0]?.creditor_id ?? 1,
            }));
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate loan result (on submit)
  const onSubmit = (data: LoanFormData) => {
    const result = calculateLoan(
      data.principal,
      data.interest_rate_monthly,
      data.loan_term_months,
      data.frequency,
      data.start_date
    );
    setCalculation(result);
    setShowSchedule(false);
    setCurrentPage(1);
    // keep allocations total in sync (optional)
  };

  const handleCalculate = () => {
    const data = watched;
    if (!data.principal || !data.interest_rate_monthly || !data.loan_term_months) return;
    const result = calculateLoan(
      Number(data.principal),
      Number(data.interest_rate_monthly),
      Number(data.loan_term_months),
      data.frequency,
      data.start_date
    );
    setCalculation(result);
    setShowSchedule(false);
    setCurrentPage(1);
  };

  // pagination derived
  const totalItems = calculation?.amortization_schedule.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentRows = calculation ? calculation.amortization_schedule.slice(startIndex, endIndex) : [];

  // derived totals
  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (a.amount_allocated === "" ? 0 : Number(a.amount_allocated)),
    0
  );


  // Save -> validate allocations manually (must match principal), then call saveLoanWithSchedule
  const handleSave = async () => {
    if (!calculation) {
      setAllocError("Calculate loan first before saving.");
      return;
    }

    const principal = Number(watched.principal ?? 0);

    if (Math.abs(Number(totalAllocated) - principal) > 0.01) {
      setAllocError("Allocations must equal the principal amount.");
      return;
    }

    if (allocations.some((a) => !a.creditor_id || Number(a.amount_allocated) <= 0)) {
      setAllocError("Each allocation must have a creditor and an amount > 0.");
      return;
    }

    setAllocError(null);
    try {
      setSaving(true);
      const payload = {
        debtor_id: Number(watched.debtor_id),
        principal_amount: principal,
        date_released: watched.date_released,
        interest_rate_monthly: Number(watched.interest_rate_monthly),
        loan_term_months: Number(watched.loan_term_months),
        frequency_of_collection: watched.frequency,
        start_date: watched.start_date,
        calculation,
        allocations,
      };
      const loanId = await saveLoanWithSchedule(payload);
      alert(`Saved! Loan ID: ${loanId}`);
      // Optionally reset form / allocations here
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Loan Calculator
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Calculate loan payments, interest, and assign which creditor(s) provide the funds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-8 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
              Loan Parameters
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Principal Amount (₱)</label>
                <input
                  type="number"
                  {...register("principal", {
                    required: "Principal is required",
                    min: { value: 1, message: "Principal must be > 0" },
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                />
                {errors.principal && <p className="mt-2 text-sm text-rose-600">{errors.principal.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Monthly Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("interest_rate_monthly", { required: "Interest is required" })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                />
                {errors.interest_rate_monthly && (
                  <p className="mt-2 text-sm text-rose-600">{errors.interest_rate_monthly.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Loan Term (months)</label>
                <input
                  type="number"
                  {...register("loan_term_months", { required: "Term is required" })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                />
                {errors.loan_term_months && <p className="mt-2 text-sm text-rose-600">{errors.loan_term_months.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Collection Frequency</label>
                <select {...register("frequency")} className="w-full px-4 py-3 border border-slate-200 rounded-xl">
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Start Date</label>
                  <input type="date" {...register("start_date")} className="w-full px-4 py-3 border rounded-xl" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Date Released</label>
                  <input type="date" {...register("date_released")} className="w-full px-4 py-3 border rounded-xl" />
                </div>
              </div>

              {/* Debtor selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Debtor
                </label>

                <select
                  {...register("debtor_id", { required: true })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                >
                  {debtors.map((d) => (
                    <option key={d.debtor_id} value={d.debtor_id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowDebtorModal(true)}
                  className="mt-2 text-blue-600 underline text-sm"
                >
                  + Add New Debtor
                </button>
              </div>


              {/* Allocations (choose creditor + amount) */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Allocations (choose creditor + amount)
                </label>

                <div className="space-y-4">
                  {allocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm"
                    >
                      {/* Creditor dropdown */}
                      <select
                        value={alloc.creditor_id}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAllocations((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], creditor_id: val };
                            return next;
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        {creditors.map((c) => (
                          <option key={c.creditor_id} value={c.creditor_id}>
                            {c.first_name} {c.last_name} — Available: ₱
                            {Number(c.available ?? 0).toLocaleString()}
                          </option>
                        ))}
                      </select>

                      {/* Amount field */}
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Amount"
                        value={
                          alloc.amount_allocated === ""
                            ? ""
                            : Math.min(
                                Number(alloc.amount_allocated),
                                Number(creditors.find(c => c.creditor_id === alloc.creditor_id)?.available ?? 0)
                              )
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === "" ? "" : Number(raw);

                          // find creditor's available amount
                          const selectedCreditor = creditors.find(c => c.creditor_id === alloc.creditor_id);
                          const max = Number(selectedCreditor?.available ?? 0);

                          // 🛑 Clamp if user exceeds available
                          if (num !== "" && num > max) {
                            setAllocError(`Cannot allocate more than available (₱${max.toLocaleString()})`);

                            // Force the value back to max
                            setAllocations(prev => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], amount_allocated: max };
                              return next;
                            });

                            return;
                          }

                          // valid input
                          setAllocError(null);

                          setAllocations(prev => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], amount_allocated: raw === "" ? "" : num };
                            return next;
                          });
                        }}
                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />

                      {/* Remove button with trash icon */}
                      <button
                        type="button"
                        onClick={() =>
                          setAllocations((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Remove allocation"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {/* Add button + totals */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm transition"
                      onClick={() => {
                        setAllocations((prev) => [
                          ...prev,
                          {
                            creditor_id: creditors[0]?.creditor_id ?? 1,
                            amount_allocated: "",
                          },
                        ]);
                      }}
                    >
                      Add Creditor
                    </button>

                    <div className="text-sm text-slate-600">
                      Total allocated:{" "}
                      <strong>
                        ₱
                        {allocations
                          .reduce(
                            (s, a) =>
                              s + (a.amount_allocated === "" ? 0 : Number(a.amount_allocated)),
                            0
                          )
                          .toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {allocError && <p className="text-sm text-rose-600">{allocError}</p>}
                </div>
              </div>


              {/* Actions */}
              <div className="flex space-x-4 pt-4">
              {/* Calculate Loan */}
              <button
                type="submit"
                disabled={
                  totalAllocated !== Number(watched.principal) ||
                  allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                }
                className={`flex-1 py-3 px-6 rounded-xl text-white font-semibold shadow-lg
                  ${
                    totalAllocated !== Number(watched.principal) ||
                    allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }`}
              >
                Calculate Loan
              </button>

              {/* Quick Calculate */}
              <button
                type="button"
                disabled={
                  totalAllocated !== Number(watched.principal) ||
                  allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                }
                onClick={handleCalculate}
                className={`flex-1 py-3 px-6 rounded-xl text-white font-semibold shadow-lg
                  ${
                    totalAllocated !== Number(watched.principal) ||
                    allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                  }`}
              >
                Quick Calculate
              </button>

              {/* Save Button */}
              <button
                type="button"
                disabled={
                  !calculation ||
                  saving ||
                  totalAllocated !== Number(watched.principal) ||
                  allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                }
                onClick={handleSave}
                className={`flex-1 py-3 px-6 rounded-xl text-white font-semibold shadow-lg
                  ${
                    !calculation ||
                    saving ||
                    totalAllocated !== Number(watched.principal) ||
                    allocations.some(a => !a.creditor_id || Number(a.amount_allocated) <= 0)
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800"
                  }`}
              >
                {saving ? "Saving…" : "Save to Supabase"}
              </button>
            </div>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white/70 rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold text-slate-800 mb-8">Loan Summary</h2>

            {calculation ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
                    <p className="text-sm">Monthly Payment</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculation.monthly_payment)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white">
                    <p className="text-sm">Total Interest</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculation.total_interest)}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Principal Amount:</span>
                    <span className="font-semibold">{formatCurrency(calculation.principal)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Interest Rate:</span>
                    <span className="font-semibold">{formatPercentage(calculation.interest_rate_monthly)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Loan Term:</span>
                    <span className="font-semibold">{calculation.loan_term_months} months</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSchedule((s) => !s)}
                  className="w-full bg-emerald-500 text-white py-3 px-6 rounded-xl"
                >
                  {showSchedule ? "Hide" : "Show"} Amortization Schedule
                </button>
              </>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <p>Enter parameters and click Calculate</p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        {calculation && showSchedule && (
          <div className="mt-12 bg-white/70 rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm">#</th>
                    <th className="p-3 text-left text-sm">Due Date</th>
                    <th className="p-3 text-left text-sm">Payment</th>
                    <th className="p-3 text-left text-sm">Principal</th>
                    <th className="p-3 text-left text-sm">Interest</th>
                    <th className="p-3 text-left text-sm">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r, i) => (
                    <tr key={r.schedule_id} className={(startIndex + i) % 2 === 0 ? "bg-white/30" : "bg-slate-50/30"}>
                      <td className="p-3 font-semibold">{r.payment_no}</td>
                      <td className="p-3">{r.due_date ? new Date(r.due_date).toLocaleDateString() : "N/A"}</td>
                      <td className="p-3">{formatCurrency(r.amortization)}</td>
                      <td className="p-3">{formatCurrency(r.principal)}</td>
                      <td className="p-3">{formatCurrency(r.interest)}</td>
                      <td className="p-3">{formatCurrency(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm">
                  Showing <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Rows per page</label>
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border rounded">
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
                  <span>Page <strong>{safePage}</strong> of <strong>{totalPages}</strong></span>
                  <button disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDebtorModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Add New Debtor</h2>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 border rounded-lg"
                    value={newDebtor.name}
                    onChange={(e) =>
                      setNewDebtor({ ...newDebtor, name: e.target.value })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Contact Info"
                    className="w-full p-3 border rounded-lg"
                    value={newDebtor.contact_info}
                    onChange={(e) =>
                      setNewDebtor({ ...newDebtor, contact_info: e.target.value })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Address"
                    className="w-full p-3 border rounded-lg"
                    value={newDebtor.address}
                    onChange={(e) =>
                      setNewDebtor({ ...newDebtor, address: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-200"
                    onClick={() => setShowDebtorModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                    onClick={async () => {
                      try {
                        const debtor_id = await addDebtor(newDebtor);

                        // Update dropdown data
                        const updated = [
                          ...debtors,
                          { debtor_id, ...newDebtor }
                        ];
                        setDebtors(updated);

                        // Automatically select newly added debtor
                        setValue("debtor_id", debtor_id);

                        // Close modal
                        setShowDebtorModal(false);

                        // Reset modal form
                        setNewDebtor({ name: "", contact_info: "", address: "" });

                        alert("Debtor added successfully!");
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                  >
                    Save Debtor
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
    
  );
};

export default LoanCalculator;
