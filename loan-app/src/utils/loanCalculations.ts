import { Decimal } from 'decimal.js';
import type { LoanCalculation, RepaymentSchedule } from '../types/loan';

export const calculateLoan = (
  principal: number,
  interest_rate_monthly: number,
  loan_term_months: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  startDate: string = new Date().toISOString().split('T')[0]
): LoanCalculation => {
  const principalDecimal = new Decimal(principal);
  const monthlyRate = new Decimal(interest_rate_monthly).div(100);
  
  // Calculate monthly payment using amortization formula
  const monthlyPayment = principalDecimal
    .mul(monthlyRate)
    .mul(new Decimal(1).add(monthlyRate).pow(loan_term_months))
    .div(new Decimal(1).add(monthlyRate).pow(loan_term_months).minus(1));

  const totalAmount = monthlyPayment.mul(loan_term_months);
  const totalInterest = totalAmount.minus(principalDecimal);

  // Generate amortization schedule with proper dates
  const amortizationSchedule: RepaymentSchedule[] = [];
  let remainingBalance = principalDecimal;

  // Calculate number of payments based on frequency
  let totalPayments: number;
  let paymentAmount: number;
  
  switch (frequency) {
    case 'daily':
      totalPayments = Math.ceil(loan_term_months * 30); // Approximate days per month
      paymentAmount = monthlyPayment.div(30).toNumber();
      break;
    case 'weekly':
      totalPayments = Math.ceil(loan_term_months * 4.33); // Approximate weeks per month
      paymentAmount = monthlyPayment.div(4.33).toNumber();
      break;
    case 'monthly':
      totalPayments = loan_term_months;
      paymentAmount = monthlyPayment.toNumber();
      break;
    default:
      totalPayments = loan_term_months;
      paymentAmount = monthlyPayment.toNumber();
  }

  for (let i = 1; i <= totalPayments; i++) {
    // Calculate interest for this period
    let interest: Decimal;
    let principalPayment: Decimal;
    let actualPayment: Decimal;
    
    if (frequency === 'daily') {
      // For daily payments, use daily interest rate
      const dailyRate = monthlyRate.div(30);
      interest = remainingBalance.mul(dailyRate);
    } else if (frequency === 'weekly') {
      // For weekly payments, use weekly interest rate
      const weeklyRate = monthlyRate.div(4.33);
      interest = remainingBalance.mul(weeklyRate);
    } else {
      // For monthly payments, use monthly interest rate
      interest = remainingBalance.mul(monthlyRate);
    }
    
    // Calculate principal payment
    principalPayment = new Decimal(paymentAmount).minus(interest);
    
    // Ensure we don't overpay (balance should not go negative)
    if (principalPayment.greaterThan(remainingBalance)) {
      principalPayment = remainingBalance;
    }
    
    actualPayment = principalPayment.add(interest);
    remainingBalance = remainingBalance.minus(principalPayment);
    
    // If balance is very small (less than 1 cent), set it to zero
    if (remainingBalance.lessThan(new Decimal(0.01))) {
      remainingBalance = new Decimal(0);
    }

    // Calculate due date based on frequency
    let dueDate: string;
    switch (frequency) {
      case 'daily':
        dueDate = addDays(startDate, i - 1);
        break;
      case 'weekly':
        dueDate = addWeeks(startDate, i - 1);
        break;
      case 'monthly':
        dueDate = addMonths(startDate, i - 1);
        break;
      default:
        dueDate = addMonths(startDate, i - 1);
    }
    
    // Debug logging for first few payments
    if (i <= 3) {
      console.log(`Payment ${i}: startDate=${startDate}, frequency=${frequency}, dueDate=${dueDate}`);
    }

    amortizationSchedule.push({
      schedule_id: i,
      loan_id: 0, // Will be set when loan is created
      payment_no: i,
      due_date: dueDate,
      amortization: actualPayment.toNumber(),
      principal: principalPayment.toNumber(),
      interest: interest.toNumber(),
      balance: remainingBalance.toNumber(),
    });
    
    // If balance is zero, we're done
    if (remainingBalance.equals(0)) {
      break;
    }
  }

  return {
    principal,
    interest_rate_monthly,
    loan_term_months,
    frequency,
    monthly_payment: monthlyPayment.toNumber(),
    total_interest: totalInterest.toNumber(),
    total_amount: totalAmount.toNumber(),
    amortization_schedule: amortizationSchedule,
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

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addMonths = (date: string, months: number): string => {
  const d = new Date(date);
  const newDate = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  const result = newDate.toISOString().split('T')[0];
  console.log(`addMonths: ${date} + ${months} months = ${result}`);
  return result;
};

export const addDays = (date: string, days: number): string => {
  const d = new Date(date);
  const newDate = new Date(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const result = newDate.toISOString().split('T')[0];
  console.log(`addDays: ${date} + ${days} days = ${result}`);
  return result;
};

export const addWeeks = (date: string, weeks: number): string => {
  const d = new Date(date);
  const newDate = new Date(d.getTime() + (weeks * 7 * 24 * 60 * 60 * 1000));
  const result = newDate.toISOString().split('T')[0];
  console.log(`addWeeks: ${date} + ${weeks} weeks = ${result}`);
  return result;
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
