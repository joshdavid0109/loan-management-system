import React, { useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { mockLoans } from '../data/mockData';
import type { Loan, RepaymentSchedule } from '../types/loan';
import { formatCurrency, calculateLoan, addDays, addWeeks, addMonths, testSimpleDateCalculations } from '../utils/loanCalculations';

const LoansManagement: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>(mockLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RepaymentSchedule[]>([]);

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.debtor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.creditor?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.creditor?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loan_id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  const handleViewSchedule = (loan: Loan) => {
    // Run simple date test first
    testSimpleDateCalculations();
    
    // Debug: Log the loan details
    console.log('Loan details:', {
      principal: loan.principal_amount,
      interest_rate: loan.interest_rate_monthly,
      term: loan.loan_term_months,
      frequency: loan.frequency_of_collection,
      start_date: loan.start_date,
      date_released: loan.date_released
    });
    
    const startDate = loan.start_date || loan.date_released;
    console.log('Using start date:', startDate);
    
    // Test date calculations directly
    console.log('=== Testing Date Calculations ===');
    for (let i = 0; i < 5; i++) {
      let testDate: string;
      switch (loan.frequency_of_collection) {
        case 'daily':
          testDate = addDays(startDate, i);
          break;
        case 'weekly':
          testDate = addWeeks(startDate, i);
          break;
        case 'monthly':
          testDate = addMonths(startDate, i);
          break;
        default:
          testDate = addMonths(startDate, i);
      }
      console.log(`Test Payment ${i + 1}: ${testDate}`);
    }
    
    const schedule = calculateLoan(
      loan.principal_amount,
      loan.interest_rate_monthly,
      loan.loan_term_months,
      loan.frequency_of_collection,
      startDate
    ).amortization_schedule;
    
    console.log('Generated schedule (first 5 payments):', schedule.slice(0, 5));
    setSelectedSchedule(schedule);
    setShowSchedule(true);
  };

  const handleDeleteLoan = (loanId: number) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      setLoans(loans.filter(loan => loan.loan_id !== loanId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Loans Management
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Manage all loans, track their status, and monitor portfolio performance
              </p>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center">
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
              <span className="text-sm text-slate-500 bg-white/60 px-4 py-2 rounded-lg border border-slate-200">
                Showing {filteredLoans.length} of {loans.length} loans
              </span>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Debtor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Creditor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Interest Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200">
                {filteredLoans.map((loan) => (
                  <tr key={loan.loan_id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200">
                        #{loan.loan_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {loan.debtor?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {loan.debtor?.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {loan.debtor?.contact_info}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {loan.creditor?.first_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {loan.creditor?.first_name} {loan.creditor?.last_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {loan.creditor?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(loan.principal_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                        {loan.interest_rate_monthly}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {loan.loan_term_months} months
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getFrequencyColor(loan.frequency_of_collection)}`}>
                        {loan.frequency_of_collection}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewLoan(loan)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewSchedule(loan)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="View Schedule"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                          title="Edit Loan"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.loan_id)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                          title="Delete Loan"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  <h3 className="text-2xl font-bold text-slate-900">
                    Loan Details - #{selectedLoan.loan_id}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center">
                      <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
                      Loan Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Principal Amount:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(selectedLoan.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Interest Rate:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.interest_rate_monthly}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Loan Term:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.loan_term_months} months</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Collection Frequency:</span>
                        <span className="font-semibold text-slate-900 capitalize">{selectedLoan.frequency_of_collection}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Date Released:</span>
                        <span className="font-semibold text-slate-900">{new Date(selectedLoan.date_released).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Status:</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedLoan.status)}`}>
                          {selectedLoan.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center">
                      <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>
                      Debtor Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Name:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.debtor?.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Contact:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.debtor?.contact_info}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Address:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.debtor?.address}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg mt-8 flex items-center">
                      <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mr-3"></div>
                      Creditor Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Name:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedLoan.creditor?.first_name} {selectedLoan.creditor?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Email:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.creditor?.email}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Phone:</span>
                        <span className="font-semibold text-slate-900">{selectedLoan.creditor?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold"
                  >
                    Close
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">
                    Edit Loan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repayment Schedule Modal */}
        {showSchedule && selectedSchedule.length > 0 && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Repayment Schedule
                  </h3>
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Payment Schedule
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedSchedule.length} payments scheduled
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/80 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Payment #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Amount Due
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Principal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Interest
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Remaining Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 divide-y divide-slate-200">
                        {selectedSchedule.map((payment) => (
                          <tr key={payment.schedule_id} className="hover:bg-slate-50/80 transition-colors duration-150">
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
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-bold text-slate-900">
                                  {formatCurrency(payment.amortization)}
                                </span>
                              </div>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Payments:</span>
                        <span className="font-semibold text-slate-900">{selectedSchedule.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Amount:</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(selectedSchedule.reduce((sum, payment) => sum + payment.amortization, 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Next Payment:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedSchedule.length > 0 ? new Date(selectedSchedule[0].due_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold"
                  >
                    Close
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

export default LoansManagement;
