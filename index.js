const express = require('express');
const path = require('path'); // Node.js built-in path module
const app = express();

const port = process.env.PORT || 3000; // Use port 3000 by default

// Serve static files from the root of the project
// This allows access to /index.html, /creditors.html, and the assets folder
app.use(express.static(path.join(__dirname, ''))); // Serves files from the current directory'
// Make sure you have these middleware in your index.js
app.use(express.json()); // For parsing JSON bodies
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Define routes for your HTML pages
// You don't strictly need these if express.static handles index.html by default
// but it's good for explicit routing and ensuring other pages load.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/creditors', (req, res) => {
    res.sendFile(path.join(__dirname, 'creditors.html'));
});

app.get('/loans', (req, res) => {
    res.sendFile(path.join(__dirname, 'loans.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

function calculateLoanValues(principalAmount, loanTermMonths, interestRate = 10) {
    // Calculate total interest
    const totalInterest = (principalAmount * interestRate / 100) * loanTermMonths;
    
    // Calculate total balance
    const totalBalance = principalAmount + totalInterest;
    
    // Calculate daily amortization (assuming 30 days per month)
    const totalDays = loanTermMonths * 30;
    const dailyAmortization = totalBalance / totalDays;
    
    return {
        principalAmount: parseFloat(principalAmount),
        interestRate,
        loanTermMonths: parseInt(loanTermMonths),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        dailyAmortization: parseFloat(dailyAmortization.toFixed(2)),
        totalDays
    };
}

function generateAmortizationSchedule(loanData, frequency = 'daily', paymentStartDate = new Date()) {
    let paymentAmount, numberOfPayments, daysBetweenPayments;
    
    switch (frequency.toLowerCase()) {
        case 'weekly':
            numberOfPayments = Math.ceil(loanData.loanTermMonths * 4.33);
            paymentAmount = loanData.totalBalance / numberOfPayments;
            daysBetweenPayments = 7;
            break;
        case 'monthly':
            numberOfPayments = loanData.loanTermMonths;
            paymentAmount = loanData.totalBalance / numberOfPayments;
            daysBetweenPayments = 30;
            break;
        default: // daily
            numberOfPayments = loanData.totalDays;
            paymentAmount = loanData.dailyAmortization;
            daysBetweenPayments = 1;
    }
    
    const schedule = [];
    let remainingBalance = loanData.totalBalance;
    let currentDate = new Date(paymentStartDate);
    
    // Add initial balance row
    schedule.push({
        no: 0,
        remittanceDate: null,
        amortization: null,
        principal: null,
        interest: null,
        amortPaid: null,
        balance: parseFloat(loanData.totalBalance.toFixed(2))
    });
    
    for (let i = 1; i <= numberOfPayments; i++) {
        // Calculate interest and principal portions
        const interestPortion = (remainingBalance * (loanData.interestRate / 100)) / (30 / daysBetweenPayments);
        const principalPortion = paymentAmount - interestPortion;
        
        remainingBalance -= principalPortion;
        
        // Adjust for final payment to avoid rounding issues
        if (remainingBalance < 0.01) {
            remainingBalance = 0;
        }
        
        schedule.push({
            no: i,
            remittanceDate: new Date(currentDate).toISOString().split('T')[0], // YYYY-MM-DD format
            amortization: parseFloat(paymentAmount.toFixed(2)),
            principal: parseFloat(principalPortion.toFixed(2)),
            interest: parseFloat(interestPortion.toFixed(2)),
            amortPaid: 'N',
            balance: parseFloat(remainingBalance.toFixed(2))
        });
        
        // Move to next payment date
        currentDate.setDate(currentDate.getDate() + daysBetweenPayments);
        
        if (remainingBalance <= 0) break;
    }
    
    return schedule;
}

// API Routes for loan calculations

// Route to calculate loan values
app.post('/api/calculate-loan', (req, res) => {
    try {
        const { principalAmount, loanTermMonths, interestRate } = req.body;
        
        // Validate input
        if (!principalAmount || !loanTermMonths) {
            return res.status(400).json({ 
                error: 'Principal amount and loan term are required' 
            });
        }
        
        if (principalAmount <= 0 || loanTermMonths <= 0) {
            return res.status(400).json({ 
                error: 'Principal amount and loan term must be positive numbers' 
            });
        }
        
        const loanData = calculateLoanValues(principalAmount, loanTermMonths, interestRate);
        
        res.json({
            success: true,
            data: loanData
        });
    } catch (error) {
        console.error('Error calculating loan:', error);
        res.status(500).json({ 
            error: 'Internal server error during loan calculation' 
        });
    }
});

// Route to generate amortization schedule
app.post('/api/generate-amortization', (req, res) => {
    try {
        const { principalAmount, loanTermMonths, frequency, paymentStartDate, interestRate } = req.body;
        
        // Validate input
        if (!principalAmount || !loanTermMonths) {
            return res.status(400).json({ 
                error: 'Principal amount and loan term are required' 
            });
        }
        
        const loanData = calculateLoanValues(principalAmount, loanTermMonths, interestRate);
        const startDate = paymentStartDate ? new Date(paymentStartDate) : new Date();
        const schedule = generateAmortizationSchedule(loanData, frequency, startDate);
        
        res.json({
            success: true,
            data: {
                loanData,
                schedule,
                summary: {
                    totalPayments: schedule.length - 1, // Exclude initial balance row
                    frequency: frequency || 'daily',
                    startDate: startDate.toISOString().split('T')[0]
                }
            }
        });
    } catch (error) {
        console.error('Error generating amortization schedule:', error);
        res.status(500).json({ 
            error: 'Internal server error during schedule generation' 
        });
    }
});

// Route to update payment status
app.post('/api/update-payment-status', (req, res) => {
    try {
        const { loanId, paymentNo, status } = req.body;
        
        // Validate input
        if (!loanId || paymentNo === undefined || !status) {
            return res.status(400).json({ 
                error: 'Loan ID, payment number, and status are required' 
            });
        }
        
        if (!['Y', 'N'].includes(status)) {
            return res.status(400).json({ 
                error: 'Status must be either Y or N' 
            });
        }
        
        // Here you would typically update your database
        // For now, we'll just return a success response
        console.log(`Payment ${paymentNo} for loan ${loanId} updated to: ${status}`);
        
        res.json({
            success: true,
            message: `Payment status updated successfully`,
            data: {
                loanId,
                paymentNo,
                status,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ 
            error: 'Internal server error during payment status update' 
        });
    }
});

// Route to get loan summary
app.get('/api/loan-summary/:loanId', (req, res) => {
    try {
        const { loanId } = req.params;
        
        // Here you would typically fetch from your database
        // For now, we'll return a mock response
        res.json({
            success: true,
            data: {
                loanId,
                status: 'active',
                principalAmount: 10000,
                totalBalance: 12000,
                remainingBalance: 8000,
                paidPayments: 15,
                totalPayments: 30,
                nextPaymentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error fetching loan summary:', error);
        res.status(500).json({ 
            error: 'Internal server error during loan summary fetch' 
        });
    }
});

// Middleware to handle loan-related database operations (if you're using a database)
function saveLoanToDatabase(loanData, schedule) {
    // Implement your database save logic here
    // This is a placeholder function
    console.log('Saving loan data to database:', {
        loanData,
        scheduleLength: schedule.length
    });
    
    // Return a mock loan ID
    return 'loan_' + Date.now();
}

// Export functions for use in other modules (if needed)
module.exports = {
    calculateLoanValues,
    generateAmortizationSchedule,
    saveLoanToDatabase
};

// Start the server
app.listen(port, () => {
    console.log(`Node.js server running at http://localhost:${port}`);
});