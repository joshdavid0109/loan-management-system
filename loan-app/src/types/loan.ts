export interface Creditor {
  creditor_id: number;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | 'Other';
  phone?: string;
  email?: string;
  address?: string;
}

export interface Debtor {
  debtor_id: number;
  name: string;
  contact_info?: string;
  address?: string;
}
export interface Loan {
  loan_id: number;
  debtor_id: number;
  creditor_id: number;
  principal_amount: number;
  date_released: string;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency_of_collection: string;
  start_date: string;
  status: string;

  // MAKE THESE OPTIONAL
  debtor?: Debtor | null;
  creditor?: Creditor | null;
}


export interface RepaymentSchedule {
  schedule_id: number;
  loan_id: number;
  payment_no: number;
  due_date: string;
  amortization: number;
  principal: number;
  interest: number;
  amount_paid_flag?: boolean;
  balance: number;
}

export interface Payment {
  payment_id: number;
  loan_id: number;
  schedule_id?: number;
  payment_date: string;
  amount_paid: number;
  payment_method?: string;
  remarks?: string;
}

export interface LoanSchedule {
  schedule_id: number;
  loan_id: number;
  due_date: string;
  expected_amount: number;
  status: 'Due' | 'Paid' | 'Missed';
}

export interface LoanCalculation {
  principal: number;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  monthly_payment: number;
  total_interest: number;
  total_amount: number;
  amortization_schedule: RepaymentSchedule[];
}

export interface DashboardStats {
  total_loans: number;
  active_loans: number;
  completed_loans: number;
  defaulted_loans: number;
  total_outstanding: number;
  total_collected: number;
  monthly_collection: number;
}

export interface Allocation {
  creditor_id: number;
  amount_allocated: number | string;
}

export interface CreateLoanInput {
  debtor_id: number;
  principal_amount: number;
  date_released: string;
  interest_rate_monthly: number;
  loan_term_months: number;
  frequency_of_collection: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  calculation: LoanCalculation;
  allocations: Allocation[]; // NEW
}
