import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LoanCalculator from './components/LoanCalculator';
import LoansManagement from './components/LoansManagement';
import DebtorsManagement from './components/DebtorsManagement';
import CreditorsManagement from './components/CreditorsManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'calculator':
        return <LoanCalculator />;
      case 'loans':
        return <LoansManagement onCreateNewLoan={() => setCurrentPage('calculator')} />;
      case 'debtors':
        return <DebtorsManagement />;
      case 'creditors':
        return <CreditorsManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="lg:pl-64">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

