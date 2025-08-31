import React, { useState } from 'react';
import { 
  HomeIcon, 
  CalculatorIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  BanknotesIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: HomeIcon, current: currentPage === 'dashboard' },
    { name: 'Loan Calculator', href: 'calculator', icon: CalculatorIcon, current: currentPage === 'calculator' },
    { name: 'Loans Management', href: 'loans', icon: DocumentTextIcon, current: currentPage === 'loans' },
    { name: 'Debtors', href: 'debtors', icon: UserGroupIcon, current: currentPage === 'debtors' },
    { name: 'Creditors', href: 'creditors', icon: BanknotesIcon, current: currentPage === 'creditors' },
    { name: 'Reports', href: 'reports', icon: ChartBarIcon, current: currentPage === 'reports' },
    { name: 'Settings', href: 'settings', icon: CogIcon, current: currentPage === 'settings' },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200/50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Loan Management
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onPageChange(item.href);
                  setSidebarOpen(false);
                }}
                className={`${
                  item.current
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-xl w-full transition-all duration-200`}
              >
                <item.icon
                  className={`${
                    item.current ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'
                  } mr-3 h-5 w-5 transition-colors duration-200`}
                />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          <div className="flex h-20 items-center px-6 border-b border-slate-200/50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Loan Management
            </h1>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => onPageChange(item.href)}
                className={`${
                  item.current
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-xl w-full transition-all duration-200`}
              >
                <item.icon
                  className={`${
                    item.current ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'
                  } mr-3 h-5 w-5 transition-colors duration-200`}
                />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
        <div className="flex h-20 items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Loan Management
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="lg:pl-72">
        <div className="lg:hidden h-20" /> {/* Spacer for mobile top bar */}
      </div>
    </>
  );
};

export default Navigation;
