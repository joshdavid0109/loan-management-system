import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { formatCurrency } from "../utils/loanCalculations";
import { CalendarIcon } from "@heroicons/react/24/outline";

type CreditorSplit = {
  creditor_id: number;
  name: string;
  share: number;
};

type PaymentStatus = "on_time" | "late" | "partial";

type PaymentRow = {
  payment_id: number;
  payment_date: string;
  amount_paid: number;
  payment_method: string;

  loan_id: number;
  debtor_name: string;

  payment_no: number;
  due_date: string;
  amortization: number;

  status: PaymentStatus;
  creditors: CreditorSplit[];
};

// ✅ Date formatter (month names)
const formatDateLong = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const PaymentsManagement = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const PAGE_SIZE_OPTIONS = [10, 20, 50];

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter, sortBy, sortDir, pageSize]);



  useEffect(() => {
    fetchPayments();
  }, []);



  const fetchPayments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("payments")
      .select(`
        payment_id,
        loan_id,
        schedule_id,
        payment_date,
        amount_paid,
        payment_method,

        loans (
          principal_amount,
          debtors ( name ),
          loan_allocations (
            amount_allocated,
            creditors (
              creditor_id,
              first_name,
              last_name
            )
          )
        ),

        repayment_schedule (
          payment_no,
          due_date,
          amortization
        )
      `)
      .order("payment_date", { ascending: false })
      .order("payment_id", { ascending: false });


    if (error) {
      console.error(error);
      alert("Failed to load payments");
      return;
    }

    const mapped: PaymentRow[] = (data ?? []).map((p: any) => {
      const paidDate = new Date(p.payment_date);
      const dueDate = new Date(p.repayment_schedule.due_date);

      const amortization = Number(p.repayment_schedule.amortization);
      const amountPaid = Number(p.amount_paid);

      let status: PaymentStatus;

        if (amountPaid < amortization) {
        // ❗ PARTIAL applies ONLY to this schedule
        status = "partial";
        } else if (paidDate > dueDate) {
        status = "late";
        } else {
        status = "on_time";
        }


      const principal = Number(p.loans.principal_amount);
      const allocations = p.loans.loan_allocations ?? [];

      const creditors: CreditorSplit[] = allocations.map((a: any) => ({
        creditor_id: a.creditors.creditor_id,
        name: `${a.creditors.first_name} ${a.creditors.last_name}`,
        share:
          amountPaid * (Number(a.amount_allocated) / principal),
      }));

      return {
        payment_id: p.payment_id,
        payment_date: p.payment_date,
        amount_paid: amountPaid,
        payment_method: p.payment_method,

        loan_id: p.loan_id,
        debtor_name: p.loans.debtors.name,

        payment_no: p.repayment_schedule.payment_no,
        due_date: p.repayment_schedule.due_date,
        amortization,

        status,
        creditors,
      };
    });

    setPayments(mapped);
    setLoading(false);
  };

  const filteredPayments = payments
  .filter((p) => {
    const q = search.toLowerCase();

    const matchesSearch =
      p.debtor_name.toLowerCase().includes(q) ||
      String(p.loan_id).includes(q) ||
      p.creditors.some((c) => c.name.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    if (sortBy === "date") {
      const da = new Date(a.payment_date).getTime();
      const db = new Date(b.payment_date).getTime();
      return sortDir === "asc" ? da - db : db - da;
    }

    if (sortBy === "amount") {
      return sortDir === "asc"
        ? a.amount_paid - b.amount_paid
        : b.amount_paid - a.amount_paid;
    }

    return 0;
  });

  // ✅ PAGINATION (STEP 3)
const totalPages = Math.ceil(filteredPayments.length / pageSize);

const paginatedPayments = filteredPayments.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);



  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Payments Management</h1>
        <div className="flex flex-wrap gap-4 mb-6">
        {/* SEARCH */}
        <input
            type="text"
            placeholder="Search loan, debtor, creditor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm w-64"
        />

        {/* STATUS FILTER */}
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg text-sm"
        >
            <option value="all">All Status</option>
            <option value="on_time">On Time</option>
            <option value="partial">Partial</option>
            <option value="late">Late</option>
        </select>

        {/* SORT BY */}
        <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded-lg text-sm"
        >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
        </select>

        {/* SORT DIRECTION */}
        <button
            onClick={() =>
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
            }
            className="px-4 py-2 border rounded-lg text-sm"
        >
            {sortDir === "asc" ? "↑ Ascending" : "↓ Descending"}
        </button>
        </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-slate-100">
            <tr>
                <th className="px-4 py-3 text-left text-sm">Date Paid</th>
                <th className="px-4 py-3 text-left text-sm">Due Date</th>
                <th className="px-4 py-3 text-left text-sm">Loan</th>
                <th className="px-4 py-3 text-left text-sm">Debtor</th>
                <th className="px-4 py-3 text-left text-sm">Amount</th>
                <th className="px-4 py-3 text-left text-sm">Status</th>
                <th className="px-4 py-3 text-left text-sm">Creditors</th>
            </tr>
        </thead>


          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  Loading payments…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p) => (
                <tr key={p.payment_id} className="hover:bg-slate-50">
                 {/* DATE PAID */}
                <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    {formatDateLong(p.payment_date)}
                </div>
                </td>

                {/* DUE DATE */}
                <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    {formatDateLong(p.due_date)}
                </div>
                </td>

                  {/* LOAN / SCHEDULE */}
                  <td className="px-4 py-3 text-sm font-semibold">
                    <div>Loan #{p.loan_id}</div>
                    <div className="text-xs text-slate-500">
                      Schedule #{p.payment_no}
                    </div>
                  </td>

                  {/* DEBTOR */}
                  <td className="px-4 py-3 text-sm">
                    {p.debtor_name}
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 py-3 text-sm font-bold">
                    {formatCurrency(p.amount_paid)}
                    {p.status === "partial" && (
                      <div className="text-xs text-amber-600">
                        of {formatCurrency(p.amortization)}
                      </div>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3 text-sm">
                    <span
                      title={`Due ${formatDateLong(p.due_date)} • Paid ${formatDateLong(p.payment_date)}`}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === "late"
                          ? "bg-red-100 text-red-700"
                          : p.status === "partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.status === "late"
                        ? "Late"
                        : p.status === "partial"
                        ? "Partial"
                        : "On Time"}
                    </span>
                  </td>

                  {/* CREDITORS */}
                  <td className="px-4 py-3 text-sm space-y-1">
                    {p.creditors.map((c) => (
                      <div key={c.creditor_id}>
                        {c.name}:{" "}
                        <b>{formatCurrency(c.share)}</b>
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-4 m-10">
          {/* PAGE INFO */}
          <div className="text-sm text-slate-600">
            Showing{" "}
            <b>
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredPayments.length)}
            </b>{" "}
            of <b>{filteredPayments.length}</b> payments
          </div>

          {/* PAGE SIZE */}
          <div className="flex items-center gap-2 text-sm">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border rounded-md"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* PAGINATION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm border ${
                    page === currentPage
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
      </div>

      </div>
    </div>
  );
};

export default PaymentsManagement;
