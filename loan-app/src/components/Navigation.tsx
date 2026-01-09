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
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../utils/supabaseClient';


interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.tsx will re-render and show Login automatically
  };



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
              DPE Loan Management
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
            <div className="mt-8 pt-4 border-t border-slate-200/50">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-3 text-sm font-medium
                        text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-rose-500" />
              Logout
            </button>
          </div>

          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          <div className="flex h-20 items-center px-6 border-b border-slate-200/50 justify-center">
            <img
              src="https://cwcscejvwfbsrmrjsdxq.supabase.co/storage/v1/object/public/icons/DPE_logo.png"   // put your image in public/
              alt="DPE Loan Management"
              className="h-20 w-auto object-contain"
            />
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
            <div className="mt-8 pt-4 border-t border-slate-200/50">
            <button
              onClick={() => {
                setSidebarOpen(false);
                setShowLogoutModal(true);
              }}
              className="group flex items-center w-full px-4 py-3 text-sm font-medium
                        text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-rose-500" />
              Logout
            </button>
          </div>
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
            DPE Loan Management
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="lg:pl-72">
        <div className="lg:hidden h-20" /> {/* Spacer for mobile top bar */}
      </div>

      {showLogoutModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Confirm Logout
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to log out of your account?
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-200 text-slate-700
                        hover:bg-slate-300 transition font-medium"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                setShowLogoutModal(false);
                await handleLogout();
              }}
              className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white
                        hover:bg-rose-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
};

export default Navigation;
