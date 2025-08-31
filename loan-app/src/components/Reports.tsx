import React, { useState } from 'react';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { mockLoans, mockDebtors, mockCreditors } from '../data/mockData';
import { formatCurrency } from '../utils/loanCalculations';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<string>('all');

  // Calculate various statistics
  const totalLoans = mockLoans.length;
  const activeLoans = mockLoans.filter(loan => loan.status === 'Ongoing').length;
  const completedLoans = mockLoans.filter(loan => loan.status === 'Completed').length;
  const defaultedLoans = mockLoans.filter(loan => loan.status === 'Defaulted').length;
  
  const totalPrincipal = mockLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);
  const activePrincipal = mockLoans
    .filter(loan => loan.status === 'Ongoing')
    .reduce((sum, loan) => sum + loan.principal_amount, 0);
  
  // const totalDebtors = mockDebtors.length;
  // const totalCreditors = mockCreditors.length;

  // Calculate monthly trends
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthLoans = mockLoans.filter(loan => {
        const loanDate = new Date(loan.date_released);
        return loanDate.getMonth() === index;
      });
      return {
        month,
        loans: monthLoans.length,
        amount: monthLoans.reduce((sum, loan) => sum + loan.principal_amount, 0)
      };
    });
    return monthlyData;
  };

  const monthlyData = getMonthlyData();

  // Get top debtors by amount borrowed
  const getTopDebtors = () => {
    const debtorStats = mockDebtors.map(debtor => {
      const debtorLoans = mockLoans.filter(loan => loan.debtor_id === debtor.debtor_id);
      const totalBorrowed = debtorLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);
      return {
        name: debtor.name,
        totalBorrowed,
        loanCount: debtorLoans.length
      };
    });
    return debtorStats.sort((a, b) => b.totalBorrowed - a.totalBorrowed).slice(0, 5);
  };

  // Get top creditors by amount lent
  const getTopCreditors = () => {
    const creditorStats = mockCreditors.map(creditor => {
      const creditorLoans = mockLoans.filter(loan => loan.creditor_id === creditor.creditor_id);
      const totalLent = creditorLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);
      return {
        name: `${creditor.first_name} ${creditor.last_name}`,
        totalLent,
        loanCount: creditorLoans.length
      };
    });
    return creditorStats.sort((a, b) => b.totalLent - a.totalLent).slice(0, 5);
  };

  const topDebtors = getTopDebtors();
  const topCreditors = getTopCreditors();

  const renderOverviewReport = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Loans</p>
              <p className="text-3xl font-bold">{totalLoans}</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Active Loans</p>
              <p className="text-3xl font-bold">{activeLoans}</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Principal</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Principal</p>
              <p className="text-2xl font-bold">{formatCurrency(activePrincipal)}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />
          Monthly Loan Trends
        </h3>
        <div className="grid grid-cols-12 gap-2 h-32 items-end">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                style={{ height: `${(data.loans / Math.max(...monthlyData.map(d => d.loans))) * 100}%` }}
              ></div>
              <span className="text-xs text-slate-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-emerald-600" />
            Top Debtors
          </h3>
          <div className="space-y-4">
            {topDebtors.map((debtor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{debtor.name}</p>
                    <p className="text-sm text-slate-600">{debtor.loanCount} loans</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">{formatCurrency(debtor.totalBorrowed)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <ArrowTrendingDownIcon className="w-6 h-6 mr-2 text-blue-600" />
            Top Creditors
          </h3>
          <div className="space-y-4">
            {topCreditors.map((creditor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{creditor.name}</p>
                    <p className="text-sm text-slate-600">{creditor.loanCount} loans</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">{formatCurrency(creditor.totalLent)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoanStatusReport = () => (
    <div className="space-y-8">
      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Ongoing Loans</p>
              <p className="text-3xl font-bold">{activeLoans}</p>
              <p className="text-blue-200 text-sm">
                {((activeLoans / totalLoans) * 100).toFixed(1)}% of total
              </p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Completed Loans</p>
              <p className="text-3xl font-bold">{completedLoans}</p>
              <p className="text-emerald-200 text-sm">
                {((completedLoans / totalLoans) * 100).toFixed(1)}% of total
              </p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Defaulted Loans</p>
              <p className="text-3xl font-bold">{defaultedLoans}</p>
              <p className="text-rose-200 text-sm">
                {((defaultedLoans / totalLoans) * 100).toFixed(1)}% of total
              </p>
            </div>
            <ArrowTrendingDownIcon className="w-8 h-8 text-rose-200" />
          </div>
        </div>
      </div>

      {/* Detailed Status Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Loan Status Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    Ongoing
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {activeLoans}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {((activeLoans / totalLoans) * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {formatCurrency(activePrincipal)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Completed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {completedLoans}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {((completedLoans / totalLoans) * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {formatCurrency(mockLoans.filter(loan => loan.status === 'Completed').reduce((sum, loan) => sum + loan.principal_amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Defaulted
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {defaultedLoans}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {((defaultedLoans / totalLoans) * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {formatCurrency(mockLoans.filter(loan => loan.status === 'Defaulted').reduce((sum, loan) => sum + loan.principal_amount, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Comprehensive reports and analytics to track loan performance and business metrics
              </p>
            </div>
            <div className="flex space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center">
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Report Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedReport('overview')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedReport === 'overview'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setSelectedReport('status')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedReport === 'status'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Loan Status
            </button>
            <button
              onClick={() => setSelectedReport('performance')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedReport === 'performance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowTrendingUpIcon className="w-5 h-5 inline mr-2" />
              Performance
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="mb-8">
          {selectedReport === 'overview' && renderOverviewReport()}
          {selectedReport === 'status' && renderLoanStatusReport()}
          {selectedReport === 'performance' && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Performance Report</h3>
              <p className="text-slate-600">Performance analytics coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
