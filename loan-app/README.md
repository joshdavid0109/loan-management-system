# DPE Loan Management System

A comprehensive web-based DPE Loan Management system built with React, TypeScript, and Tailwind CSS. This system provides tools for managing loans, calculating payments, tracking debtors and creditors, and generating financial reports.

## Features

### 🏠 Dashboard
- Overview of loan portfolio performance
- Key metrics and statistics
- Visual charts and graphs
- Recent loan activity

### 🧮 Loan Calculator
- Calculate loan payments and interest
- Generate amortization schedules
- Support for daily, weekly, and monthly collection frequencies
- Real-time calculations with validation

### 📋 Loans Management
- View all loans in a comprehensive table
- Search and filter loans by various criteria
- Detailed loan information display
- Loan status tracking (Ongoing, Completed, Defaulted)

### 👥 Debtor & Creditor Management
- Manage debtor information and contact details
- Track creditor profiles and lending history
- Comprehensive contact management

### 📊 Reports & Analytics
- Financial performance metrics
- Collection reports
- Portfolio analysis
- Export capabilities

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Icons**: Heroicons
- **Build Tool**: Vite

## Database Schema

The system is designed to work with a MySQL database with the following main tables:

- `loans` - Main loan information
- `debtors` - Borrower details
- `creditors` - Lender information
- `repayment_schedule` - Payment schedules
- `payments` - Payment records
- `loan_schedule` - Collection schedules

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd loan-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Database Setup

1. Import the provided `loan.sql` file into your MySQL database
2. Update database connection settings in your backend configuration
3. Ensure all required tables are created with proper relationships

## Usage

### Dashboard
- Navigate to the dashboard to see an overview of your loan portfolio
- View key metrics like total loans, active loans, and outstanding amounts
- Monitor monthly collection trends

### Loan Calculator
- Input loan parameters (principal, interest rate, term, frequency)
- Get instant calculations for monthly payments and total interest
- View detailed amortization schedules
- Export calculations for documentation

### Loans Management
- Browse all loans in a searchable table
- Filter by status, debtor, or creditor
- View detailed loan information
- Update loan statuses and details

## Sample Data

The system includes sample data for demonstration:
- Sample creditors with contact information
- Sample debtors with addresses
- Sample loans with various terms and rates
- Calculated payment schedules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Note**: This is a frontend application. You'll need to implement the backend API endpoints to connect with your database and provide real-time data functionality.
