import type { Creditor, Debtor, Loan, DashboardStats } from '../types/loan';

export const mockCreditors: Creditor[] = [
  {
    creditor_id: 1,
    first_name: 'Juan',
    last_name: 'Santos',
    gender: 'M',
    phone: '+63 912 345 6789',
    email: 'juan.santos@example.com',
    address: '123 Main St, Manila, Philippines'
  },
  {
    creditor_id: 2,
    first_name: 'Maria',
    last_name: 'Garcia',
    gender: 'F',
    phone: '+63 923 456 7890',
    email: 'maria.garcia@example.com',
    address: '456 Oak Ave, Quezon City, Philippines'
  },
  {
    creditor_id: 3,
    first_name: 'Pedro',
    last_name: 'Martinez',
    gender: 'M',
    phone: '+63 934 567 8901',
    email: 'pedro.martinez@example.com',
    address: '789 Pine St, Makati, Philippines'
  }
];

export const mockDebtors: Debtor[] = [
  {
    debtor_id: 1,
    name: 'Roberto Cruz',
    contact_info: '+63 945 678 9012',
    address: '321 Elm St, Manila, Philippines'
  },
  {
    debtor_id: 2,
    name: 'Ana Reyes',
    contact_info: '+63 956 789 0123',
    address: '654 Maple Ave, Quezon City, Philippines'
  },
  {
    debtor_id: 3,
    name: 'Carlos Lopez',
    contact_info: '+63 967 890 1234',
    address: '987 Cedar St, Makati, Philippines'
  },
  {
    debtor_id: 4,
    name: 'Elena Torres',
    contact_info: '+63 978 901 2345',
    address: '147 Birch Rd, Manila, Philippines'
  }
];

export const mockLoans: Loan[] = [
  {
    loan_id: 1,
    debtor_id: 1,
    creditor_id: 1,
    principal_amount: 50000,
    date_released: '2025-09-01',
    interest_rate_monthly: 2.5,
    loan_term_months: 12,
    frequency_of_collection: 'monthly',
    start_date: '2025-09-01',
    status: 'Ongoing',
    debtor: mockDebtors[0],
    creditor: mockCreditors[0]
  },
  {
    loan_id: 2,
    debtor_id: 2,
    creditor_id: 2,
    principal_amount: 75000,
    date_released: '2025-09-01',
    interest_rate_monthly: 3.0,
    loan_term_months: 18,
    frequency_of_collection: 'weekly',
    start_date: '2025-09-01',
    status: 'Ongoing',
    debtor: mockDebtors[1],
    creditor: mockCreditors[1]
  },
  {
    loan_id: 3,
    debtor_id: 3,
    creditor_id: 1,
    principal_amount: 100000,
    date_released: '2025-09-01',
    interest_rate_monthly: 2.0,
    loan_term_months: 24,
    frequency_of_collection: 'monthly',
    start_date: '2025-09-01',
    status: 'Completed',
    debtor: mockDebtors[2],
    creditor: mockCreditors[0]
  },
  {
    loan_id: 4,
    debtor_id: 4,
    creditor_id: 3,
    principal_amount: 30000,
    date_released: '2025-09-01',
    interest_rate_monthly: 4.0,
    loan_term_months: 6,
    frequency_of_collection: 'daily',
    start_date: '2025-09-01',
    status: 'Ongoing',
    debtor: mockDebtors[3],
    creditor: mockCreditors[2]
  }
];

export const mockDashboardStats: DashboardStats = {
  total_loans: 4,
  active_loans: 3,
  completed_loans: 1,
  defaulted_loans: 0,
  total_outstanding: 155000,
  total_collected: 100000,
  monthly_collection: 25000
};

export const sampleLoanCalculations = {
  loan1: {
    principal: 50000,
    interest_rate_monthly: 2.5,
    loan_term_months: 12,
    frequency: 'monthly' as const,
    monthly_payment: 4725.85,
    total_interest: 6710.20,
    total_amount: 56710.20
  },
  loan2: {
    principal: 75000,
    interest_rate_monthly: 3.0,
    loan_term_months: 18,
    frequency: 'weekly' as const,
    monthly_payment: 5234.56,
    total_interest: 19222.08,
    total_amount: 94222.08
  },
  loan3: {
    principal: 100000,
    interest_rate_monthly: 2.0,
    loan_term_months: 24,
    frequency: 'monthly' as const,
    monthly_payment: 4718.23,
    total_interest: 13237.52,
    total_amount: 113237.52
  },
  loan4: {
    principal: 30000,
    interest_rate_monthly: 4.0,
    loan_term_months: 6,
    frequency: 'daily' as const,
    monthly_payment: 5475.23,
    total_interest: 2851.38,
    total_amount: 32851.38
  }
};
