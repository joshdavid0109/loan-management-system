// Loan calculation functions
function calculateLoanValues() {
    // Get input values
    const principalAmount = parseFloat(document.querySelector('input[name="principalAmount"]').value) || 0;
    const interestRate = 10; // Fixed at 10% per month
    const loanTermInput = document.querySelector('input[name="loanTerm"]');
    const loanTermMonths = parseInt(loanTermInput ? loanTermInput.value : document.querySelector('input[min="1"][max="12"]').value) || 1;
    
    // Calculate total interest
    const totalInterest = (principalAmount * interestRate / 100) * loanTermMonths;
    
    // Calculate total balance
    const totalBalance = principalAmount + totalInterest;
    
    // Calculate daily amortization (assuming 30 days per month)
    const totalDays = loanTermMonths * 30;
    const dailyAmortization = totalBalance / totalDays;
    
    // Update disabled fields in the modal
    const modal = document.querySelector('#modal-1');
    if (modal) {
        const disabledInputs = modal.querySelectorAll('input[disabled][type="number"]');
        if (disabledInputs.length >= 3) {
            disabledInputs[0].value = totalInterest.toFixed(2); // Total Interest
            disabledInputs[1].value = totalBalance.toFixed(2);  // Total Balance  
            disabledInputs[2].value = dailyAmortization.toFixed(2); // Daily Amortization
        }
    }
    
    return {
        principalAmount,
        interestRate,
        loanTermMonths,
        totalInterest,
        totalBalance,
        dailyAmortization,
        totalDays
    };
}

function generateAmortizationTable() {
    const loanData = calculateLoanValues();
    
    // Get frequency from dropdown
    const dropdownButton = document.querySelector('#modal-1 .dropdown-toggle');
    let frequency = 'daily'; // default
    
    if (dropdownButton) {
        const selectedText = dropdownButton.textContent.toLowerCase().trim();
        if (selectedText.includes('weekly')) frequency = 'weekly';
        else if (selectedText.includes('monthly')) frequency = 'monthly';
        else if (selectedText.includes('daily')) frequency = 'daily';
    }
    
    // Get payment start date
    const dateInputs = document.querySelectorAll('#modal-1 input[type="date"]');
    const paymentStartDate = new Date(dateInputs[1] ? dateInputs[1].value : new Date());
    
    // Calculate payment schedule based on frequency
    let paymentAmount, numberOfPayments, daysBetweenPayments;
    
    switch (frequency) {
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
    
    // Generate table data
    const tableData = [];
    let remainingBalance = loanData.totalBalance;
    let currentDate = new Date(paymentStartDate);
    
    // Add initial balance row
    tableData.push({
        no: 0,
        remittanceDate: '',
        amortization: '',
        principal: '',
        interest: '',
        amortPaid: '',
        balance: loanData.totalBalance.toFixed(2)
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
        
        tableData.push({
            no: i,
            remittanceDate: new Date(currentDate).toLocaleDateString(),
            amortization: paymentAmount.toFixed(2),
            principal: principalPortion.toFixed(2),
            interest: interestPortion.toFixed(2),
            amortPaid: 'N',
            balance: remainingBalance.toFixed(2)
        });
        
        // Move to next payment date
        currentDate.setDate(currentDate.getDate() + daysBetweenPayments);
        
        if (remainingBalance <= 0) break;
    }
    
    // Update the table in the DOM
    updateAmortizationTable(tableData);
    
    return tableData;
}

function updateAmortizationTable(tableData) {
    const tableBody = document.querySelector('#dataTable tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.no}</td>
            <td>${row.remittanceDate}</td>
            <td>${row.amortization ? '₱' + row.amortization : ''}</td>
            <td>${row.principal ? '₱' + row.principal : ''}</td>
            <td>${row.interest ? '₱' + row.interest : ''}</td>
            <td>${row.amortPaid ? 
                `<select class="form-select form-select-sm" onchange="updatePaymentStatus(this, ${row.no})">
                    <option value="N" ${row.amortPaid === 'N' ? 'selected' : ''}>N</option>
                    <option value="Y" ${row.amortPaid === 'Y' ? 'selected' : ''}>Y</option>
                </select>` : ''
            }</td>
            <td>${row.balance ? '₱' + row.balance : ''}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Update pagination info
    const infoElement = document.querySelector('#dataTable_info');
    if (infoElement) {
        infoElement.textContent = `Showing 1 to ${tableData.length} of ${tableData.length}`;
    }
}

function updatePaymentStatus(selectElement, paymentNo) {
    const status = selectElement.value;
    console.log(`Payment ${paymentNo} status updated to: ${status}`);
    // Add logic here to recalculate remaining balance based on payment status
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to input fields for real-time calculation
    const modal = document.querySelector('#modal-1');
    if (modal) {
        const principalInput = modal.querySelector('input[name="principalAmount"]');
        const loanTermInput = modal.querySelector('input[name="loanTerm"]') || modal.querySelector('input[min="1"][max="12"]');
        
        if (principalInput) {
            principalInput.addEventListener('input', calculateLoanValues);
        }
        
        if (loanTermInput) {
            loanTermInput.addEventListener('input', calculateLoanValues);
        }
        
        // Handle dropdown selection for frequency
        const dropdownItems = modal.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdownButton = this.closest('.dropdown').querySelector('.dropdown-toggle');
                dropdownButton.textContent = this.textContent + ' ';
                
                // Hide dropdown
                const dropdownMenu = this.closest('.dropdown-menu');
                dropdownMenu.classList.remove('show');
                
                calculateLoanValues();
            });
        });
        
        // Generate Table button
        const generateButton = modal.querySelector('button[data-bs-target="#modal-2"]');
        if (generateButton) {
            generateButton.addEventListener('click', function(e) {
                e.preventDefault();
                generateAmortizationTable();
            });
        }
    }
});