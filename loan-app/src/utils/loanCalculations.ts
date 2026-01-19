 import { Decimal } from "decimal.js";
import type { LoanCalculation, RepaymentSchedule } from "../types/loan";

const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Pure, timezone-safe date math
const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
};

const addWeeks = (date: string, weeks: number): string =>
  addDays(date, weeks * 7);

const addMonths = (date: string, months: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return toLocalDate(d);
};

export const calculateLoan = (
  principal: number,
  interestRateMonthly: number,
  months: number,
  frequency: "daily" | "weekly" | "monthly",
  startDate: string
): LoanCalculation => {
  const P = new Decimal(principal);
  const r = new Decimal(interestRateMonthly).div(100);

  const DAYS_PER_MONTH = 30;
  const WEEKS_PER_MONTH = 4;

  // ─────────────────────────────────────────────
  // 1️⃣ TOTALS (SIMPLE INTEREST)
  // ─────────────────────────────────────────────
  const totalInterest = P.mul(r).mul(months);
  const totalAmount = P.plus(totalInterest);

  // ─────────────────────────────────────────────
  // 2️⃣ PAYMENT COUNTS
  // ─────────────────────────────────────────────
  let payments: number;

  if (frequency === "daily") {
    payments = months * DAYS_PER_MONTH;
  } else if (frequency === "weekly") {
    payments = months * WEEKS_PER_MONTH;
  } else {
    payments = months;
  }

  // ─────────────────────────────────────────────
  // 3️⃣ PER-PERIOD BREAKDOWN (FIXED)
  // ─────────────────────────────────────────────
  const principalPerPeriod = P.div(payments);
  const interestPerPeriod = totalInterest.div(payments);
  const paymentPerPeriod = principalPerPeriod.plus(interestPerPeriod);

  // ─────────────────────────────────────────────
  // 4️⃣ BUILD SCHEDULE
  // ─────────────────────────────────────────────
  let balance = totalAmount;
  const schedule: RepaymentSchedule[] = [];

  for (let n = 1; n <= payments; n++) {
    balance = balance.minus(paymentPerPeriod);
    if (balance.lessThan(0)) balance = new Decimal(0);

    let dueDate = startDate;
    if (frequency === "daily") dueDate = addDays(startDate, n - 1);
    if (frequency === "weekly") dueDate = addWeeks(startDate, n - 1);
    if (frequency === "monthly") dueDate = addMonths(startDate, n - 1);

    schedule.push({
      schedule_id: n,
      loan_id: 0,
      payment_no: n,
      due_date: dueDate,
      amortization: paymentPerPeriod.toNumber(),
      principal: principalPerPeriod.toNumber(),
      interest: interestPerPeriod.toNumber(),
      balance: balance.toNumber(),
    });

    if (balance.eq(0)) break;
  }

  // ─────────────────────────────────────────────
  // 5️⃣ RETURN SUMMARY
  // ─────────────────────────────────────────────
  return {
    principal: principal,
    interest_rate_monthly: interestRateMonthly,
    loan_term_months: months,
    frequency,
    total_interest: totalInterest.toNumber(),
    total_amount: totalAmount.toNumber(),
    monthly_payment: paymentPerPeriod.mul(
      frequency === "monthly" ? 1 : frequency === "weekly" ? WEEKS_PER_MONTH : DAYS_PER_MONTH
    ).toNumber(),
    amortization_schedule: schedule,
  };
};



export const calculateDailyPayment = (monthlyPayment: number): number => {
  return new Decimal(monthlyPayment).div(30).toNumber();
};

export const calculateWeeklyPayment = (monthlyPayment: number): number => {
  return new Decimal(monthlyPayment).div(4.33).toNumber();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const formatPercentage = (value: number | string | Decimal): string => {
  if (value === null || value === undefined) return "0.00%";

  const num =
    value instanceof Decimal
      ? value.toNumber()
      : typeof value === "string"
      ? Number(value)
      : value;

  if (Number.isNaN(num)) return "0.00%";

  return `${num.toFixed(2)}%`;
};


export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


// Debug function to test date calculations
export const testDateCalculations = (startDate: string, frequency: 'daily' | 'weekly' | 'monthly') => {
  console.log('Testing date calculations:');
  console.log('Start date:', startDate);
  console.log('Frequency:', frequency);
  
  for (let i = 0; i < 5; i++) {
    let dueDate: string;
    switch (frequency) {
      case 'daily':
        dueDate = addDays(startDate, i);
        break;
      case 'weekly':
        dueDate = addWeeks(startDate, i);
        break;
      case 'monthly':
        dueDate = addMonths(startDate, i);
        break;
    }
    console.log(`Payment ${i + 1}: ${dueDate}`);
  }
};

// Simple test function to verify date calculations work
export const testSimpleDateCalculations = () => {
  console.log('=== Simple Date Test ===');
  const testDate = '2025-09-01';
  console.log('Test date:', testDate);
  console.log('Add 1 day:', addDays(testDate, 1));
  console.log('Add 1 week:', addWeeks(testDate, 1));
  console.log('Add 1 month:', addMonths(testDate, 1));
};
