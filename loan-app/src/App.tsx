import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";

import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import LoanCalculator from "./components/LoanCalculator";
import LoansManagement from "./components/LoansManagement";
import DebtorsManagement from "./components/DebtorsManagement";
import CreditorsManagement from "./components/CreditorsManagement";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Login from "../src/pages/Login"; // 👈 create this (simple login page)

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // 🔐 auth state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🛑 prevent render while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-600">Checking session…</span>
      </div>
    );
  }

  // 🔐 show login FIRST if not authenticated
  if (!user) {
    return <Login />;
  }

  // 🔁 page renderer (UNCHANGED LOGIC)
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "calculator":
        return <LoanCalculator />;
      case "loans":
        return <LoansManagement onCreateNewLoan={() => setCurrentPage("calculator")} />;
      case "debtors":
        return <DebtorsManagement />;
      case "creditors":
        return <CreditorsManagement />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ✅ NAVIGATION ONLY RENDERS WHEN LOGGED IN */}
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="lg:pl-80 pl-10">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
