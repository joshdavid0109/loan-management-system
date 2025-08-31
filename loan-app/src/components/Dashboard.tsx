import React from 'react';
import { 
  BanknotesIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockDashboardStats, mockLoans } from '../data/mockData';
import { formatCurrency } from '../utils/loanCalculations';

const Dashboard: React.FC = () => {
  const stats = mockDashboardStats;
  const loans = mockLoans;

  const chartData = [
    { name: 'Jan', amount: 25000 },
    { name: 'Feb', amount: 30000 },
    { name: 'Mar', amount: 28000 },
    { name: 'Apr', amount: 35000 },
    { name: 'May', amount: 32000 },
    { name: 'Jun', amount: 40000 },
  ];

  const pieData = [
    { name: 'Active Loans', value: stats.active_loans, color: '#6366F1' },
    { name: 'Completed', value: stats.completed_loans, color: '#10B981' },
    { name: 'Defaulted', value: stats.defaulted_loans, color: '#EF4444' },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative';
    gradient: string;
  }> = ({ title, value, icon, change, changeType, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {changeType === 'positive' ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-200" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-200" />
                )}
                <span className="text-sm ml-1 text-white/90">
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Loan Management Dashboard
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive overview of your loan portfolio performance and financial insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Loans"
            value={stats.total_loans}
            icon={<BanknotesIcon className="w-6 h-6 text-white" />}
            change="+12%"
            changeType="positive"
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Loans"
            value={stats.active_loans}
            icon={<UserGroupIcon className="w-6 h-6 text-white" />}
            change="+5%"
            changeType="positive"
            gradient="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Completed Loans"
            value={stats.completed_loans}
            icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
            change="+8%"
            changeType="positive"
            gradient="from-violet-500 to-violet-600"
          />
          <StatCard
            title="Defaulted Loans"
            value={stats.defaulted_loans}
            icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
            change="-2%"
            changeType="positive"
            gradient="from-rose-500 to-rose-600"
          />
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Financial Summary */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
              Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                <span className="text-slate-600 font-medium">Total Outstanding</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(stats.total_outstanding)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
                <span className="text-slate-600 font-medium">Total Collected</span>
                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(stats.total_collected)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <span className="text-slate-600 font-medium">Monthly Collection</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(stats.monthly_collection)}</span>
              </div>
            </div>
          </div>

          {/* Loan Status Distribution */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mr-3"></div>
              Loan Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-3"></div>
              Recent Activity
            </h3>
            <div className="space-y-4">
              {loans.slice(0, 3).map((loan) => (
                <div key={loan.loan_id} className="p-4 bg-white/60 rounded-xl border border-white/30 hover:bg-white/80 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{loan.debtor?.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{loan.debtor?.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">{formatCurrency(loan.principal_amount)}</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-1 ${
                        loan.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                        loan.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Collection Chart */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full mr-3"></div>
            Monthly Collection Trend
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#gradient)"
                radius={[8, 8, 0, 0]}
                strokeWidth={0}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
