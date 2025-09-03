import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { calculateLoan, formatCurrency, formatPercentage } from '../utils/loanCalculations';
import type { LoanCalculation } from '../types/loan';
import { saveLoanWithSchedule } from '../utils/loanService';

interface LoanFormData {
  principal: number;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  debtor_id: number;
  creditor_id: number;
  date_released: string;
}

const LoanCalculator: React.FC = () => {
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoanFormData>({
    defaultValues: {
      principal: 100000,
      interest_rate_monthly: 2.5,
      loan_term_months: 12,
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      date_released: new Date().toISOString().split('T')[0],
      debtor_id: 1,
      creditor_id: 1,
    },
  });

  const watchedValues = watch();

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
  };

  const handleCalculate = () => {
    const data = watchedValues;
    if (data.principal && data.interest_rate_monthly && data.loan_term_months) {
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
    }
  };

  // Reset to first page whenever a new calculation is shown
  useEffect(() => {
    if (showSchedule) {
      setCurrentPage(1);
    }
  }, [showSchedule, calculation]);

  // Pagination derived values
  const totalItems = calculation?.amortization_schedule.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentRows = calculation ? calculation.amortization_schedule.slice(startIndex, endIndex) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Loan Calculator
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Calculate loan payments, interest, and generate comprehensive amortization schedules with precision
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
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Principal Amount (₱)
                </label>
                <input
                  type="number"
                  {...register('principal', { 
                    required: 'Principal amount is required',
                    min: { value: 1000, message: 'Minimum amount is ₱1,000' }
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  placeholder="100000"
                />
                {errors.principal && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                    {errors.principal.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('interest_rate_monthly', { 
                    required: 'Interest rate is required',
                    min: { value: 0.01, message: 'Interest rate must be greater than 0' },
                    max: { value: 20, message: 'Interest rate cannot exceed 20%' }
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  placeholder="2.5"
                />
                {errors.interest_rate_monthly && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                    {errors.interest_rate_monthly.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Loan Term (months)
                </label>
                <input
                  type="number"
                  {...register('loan_term_months', { 
                    required: 'Loan term is required',
                    min: { value: 1, message: 'Loan term must be at least 1 month' },
                    max: { value: 360, message: 'Loan term cannot exceed 360 months' }
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  placeholder="12"
                />
                {errors.loan_term_months && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                    {errors.loan_term_months.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Collection Frequency
                </label>
                <select
                  {...register('frequency')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Date Released</label>
                  <input
                    type="date"
                    {...register('date_released')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Debtor ID</label>
                  <input
                    type="number"
                    {...register('debtor_id', { required: true, min: 1 })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Creditor ID</label>
                  <input
                    type="number"
                    {...register('creditor_id', { required: true, min: 1 })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Calculate Loan
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-6 rounded-xl hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Quick Calculate
                </button>
                <button
                  type="button"
                  disabled={!calculation || saving}
                  onClick={async () => {
                    if (!calculation) return;
                    try {
                      setSaving(true);
                      const data = watchedValues;
                      const loanId = await saveLoanWithSchedule({
                        debtor_id: Number(data.debtor_id),
                        creditor_id: Number(data.creditor_id),
                        principal_amount: Number(data.principal),
                        date_released: data.date_released,
                        interest_rate_monthly: Number(data.interest_rate_monthly),
                        loan_term_months: Number(data.loan_term_months),
                        frequency_of_collection: data.frequency,
                        start_date: data.start_date,
                        calculation,
                      });
                      alert(`Saved! Loan ID: ${loanId}`);
                    } catch (err: any) {
                      alert(`Save failed: ${err.message ?? String(err)}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 text-white py-3 px-6 rounded-xl disabled:opacity-50 hover:from-emerald-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {saving ? 'Saving...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-8 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>
              Loan Summary
            </h2>
            
            {calculation ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-sm text-blue-100 mb-2">Monthly Payment</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculation.monthly_payment)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-sm text-emerald-100 mb-2">Total Interest</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculation.total_interest)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Principal Amount:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(calculation.principal)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Interest Rate:</span>
                    <span className="font-semibold text-slate-800">{formatPercentage(calculation.interest_rate_monthly)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Loan Term:</span>
                    <span className="font-semibold text-slate-800">{calculation.loan_term_months} months</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Collection Frequency:</span>
                    <span className="font-semibold text-slate-800 capitalize">{calculation.frequency}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                      <span className="text-lg font-semibold text-slate-800">Total Amount:</span>
                      <span className="text-xl font-bold text-indigo-600">{formatCurrency(calculation.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {showSchedule ? 'Hide' : 'Show'} Amortization Schedule
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Enter loan parameters and click calculate to see results</p>
                <p className="text-sm text-slate-400 mt-2">Get instant calculations and detailed breakdowns</p>
              </div>
            )}
          </div>
        </div>

        {/* Amortization Schedule */}
        {calculation && showSchedule && (
          <div className="mt-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="px-8 py-6 border-b border-slate-200">
              <h3 className="text-2xl font-semibold text-slate-800 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mr-3"></div>
                Amortization Schedule
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Payment #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200">
                  {currentRows.map((payment, index) => (
                    <tr key={payment.schedule_id} className={`hover:bg-slate-50/80 transition-colors duration-150 ${(startIndex + index) % 2 === 0 ? 'bg-white/30' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {payment.payment_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amortization)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatCurrency(payment.principal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatCurrency(payment.interest)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4 gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span>
                {' '}to{' '}
                <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalItems}</span> payments
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">Rows per page</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-slate-700">
                    Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
                  </span>
                  <button
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCalculator;
