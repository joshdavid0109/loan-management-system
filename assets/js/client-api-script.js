// Client-side JavaScript to interact with server API
// Add this script to your loans.html file

// API helper functions
async function apiRequest(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Loan calculation functions (now using server API)
async function calculateLoanValues() {
    try {
        // Get input values
        const principalAmount = parseFloat(document.querySelector('input[name="principalAmount"]').value) || 0;
        const loanTermInput = document.querySelector('input[name="loanTerm"]');
        const loanTermMonths = parseInt(loanTermInput ? loanTermInput.value : document.querySelector('input[min="1"][max="12"]').value) || 1;
        const interestRate = 10; // Fixed at 10% per month
        
        if (principalAmount <= 0 || loanTermMonths <= 0) {
            return;
        }
        
        // Call server API
        const response = await apiRequest('/api/calculate-loan', 'POST', {
            principalAmount,
            loanTermMonths,
            interestRate
        });
        
        if (response.success) {
            const loanData = response.data;
            
            // Update disabled fields in the modal
            const modal = document.querySelector('#modal-1');
            if (modal) {
                // Try different selectors to find the disabled inputs
                let disabledInputs = modal.querySelectorAll('input[disabled][type="number"]');
                
                // If the above doesn't work, try these alternatives
                if (disabledInputs.length === 0) {
                    disabledInputs = modal.querySelectorAll('input[readonly][type="number"]');
                }
                if (disabledInputs.length === 0) {
                    disabledInputs = modal.querySelectorAll('input[type="number"]:disabled');
                }
                if (disabledInputs.length === 0) {
                    disabledInputs = modal.querySelectorAll('input[type="number"][readonly]');
                }
                
                console.log('Found disabled inputs:', disabledInputs.length);
                
                if (disabledInputs.length >= 3) {
                    // Total Interest
                    disabledInputs[0].value = loanData.totalInterest.toFixed(2);
                    console.log('Updated Total Interest:', loanData.totalInterest.toFixed(2));
                    
                    // Total Balance
                    disabledInputs[1].value = loanData.totalBalance.toFixed(2);
                    console.log('Updated Total Balance:', loanData.totalBalance.toFixed(2));
                    
                    // Daily Amortization
                    disabledInputs[2].value = loanData.dailyAmortization.toFixed(2);
                    console.log('Updated Daily Amortization:', loanData.dailyAmortization.toFixed(2));
                } else {
                    // Try to find by specific names or IDs if available
                    const totalInterestField = modal.querySelector('input[name="totalInterest"], #totalInterest, input[placeholder*="Interest"]');
                    const totalBalanceField = modal.querySelector('input[name="totalBalance"], #totalBalance, input[placeholder*="Balance"]');
                    const dailyAmortField = modal.querySelector('input[name="dailyAmortization"], #dailyAmortization, input[placeholder*="Amortization"]');
                    
                    if (totalInterestField) {
                        totalInterestField.value = loanData.totalInterest.toFixed(2);
                        console.log('Updated Total Interest (by name):', loanData.totalInterest.toFixed(2));
                    }
                    if (totalBalanceField) {
                        totalBalanceField.value = loanData.totalBalance.toFixed(2);
                        console.log('Updated Total Balance (by name):', loanData.totalBalance.toFixed(2));
                    }
                    if (dailyAmortField) {
                        dailyAmortField.value = loanData.dailyAmortization.toFixed(2);
                        console.log('Updated Daily Amortization (by name):', loanData.dailyAmortization.toFixed(2));
                    }
                }
            }
            
            return loanData;
        }
    } catch (error) {
        console.error('Error calculating loan values:', error);
        showErrorMessage('Failed to calculate loan values. Please try again.');
    }
}

async function generateAmortizationTable() {
    try {
        // Get input values
        const principalAmount = parseFloat(document.querySelector('input[name="principalAmount"]').value) || 0;
        const loanTermInput = document.querySelector('input[name="loanTerm"]');
        const loanTermMonths = parseInt(loanTermInput ? loanTermInput.value : document.querySelector('input[min="1"][max="12"]').value) || 1;
        const interestRate = 10;
        
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
        const paymentStartDate = dateInputs[1] ? dateInputs[1].value : new Date().toISOString().split('T')[0];
        
        if (principalAmount <= 0 || loanTermMonths <= 0) {
            showErrorMessage('Please enter valid principal amount and loan term.');
            return;
        }
        
        // Show loading state
        showLoadingMessage('Generating amortization schedule...');
        
        // Call server API
        const response = await apiRequest('/api/generate-amortization', 'POST', {
            principalAmount,
            loanTermMonths,
            frequency,
            paymentStartDate,
            interestRate
        });
        
        if (response.success) {
            const { schedule, summary } = response.data;
            
            // Update the table in the DOM
            updateAmortizationTable(schedule);
            
            // Hide loading message
            hideLoadingMessage();
            
            console.log('Amortization schedule generated:', summary);
        }
    } catch (error) {
        console.error('Error generating amortization table:', error);
        hideLoadingMessage();
        showErrorMessage('Failed to generate amortization schedule. Please try again.');
    }
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
            <td>${row.remittanceDate || ''}</td>
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

async function updatePaymentStatus(selectElement, paymentNo) {
    try {
        const status = selectElement.value;
        const loanId = 'current_loan'; // You might want to get this from somewhere
        
        const response = await apiRequest('/api/update-payment-status', 'POST', {
            loanId,
            paymentNo,
            status
        });
        
        if (response.success) {
            console.log(`Payment ${paymentNo} status updated to: ${status}`);
            // You might want to recalculate the remaining balance here
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        showErrorMessage('Failed to update payment status. Please try again.');
        
        // Revert the select value on error
        selectElement.value = selectElement.value === 'Y' ? 'N' : 'Y';
    }
}

// Utility functions for user feedback
function showErrorMessage(message) {
    // You can customize this to match your UI
    alert('Error: ' + message);
}

function showLoadingMessage(message) {
    // You can customize this to show a loading spinner or message
    console.log('Loading: ' + message);
}

function hideLoadingMessage() {
    // Hide your loading spinner or message
    console.log('Loading complete');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to input fields for real-time calculation
    const modal = document.querySelector('#modal-1');
    if (modal) {
        const principalInput = modal.querySelector('input[name="principalAmount"]');
        const loanTermInput = modal.querySelector('input[name="loanTerm"]') || modal.querySelector('input[min="1"][max="12"]');
        
        // Debounce function to avoid too many API calls
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        const debouncedCalculate = debounce(calculateLoanValues, 300); // Reduced wait time
        
        if (principalInput) {
            principalInput.addEventListener('input', debouncedCalculate);
            principalInput.addEventListener('change', calculateLoanValues); // Also trigger on change
        }
        
        if (loanTermInput) {
            loanTermInput.addEventListener('input', debouncedCalculate);
            loanTermInput.addEventListener('change', calculateLoanValues); // Also trigger on change
        }
        
        // Handle dropdown selection for frequency
        const dropdownItems = modal.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdownButton = this.closest('.dropdown').querySelector('.dropdown-toggle');
                dropdownButton.innerHTML = this.textContent + ' <span class="caret"></span>';
                
                // Hide dropdown manually
                const dropdownMenu = this.closest('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }
                
                // Trigger calculation after dropdown change
                setTimeout(() => {
                    calculateLoanValues();
                }, 100);
            });
        });

        // Also handle Bootstrap dropdown events
        const dropdown = modal.querySelector('.dropdown-toggle');
        if (dropdown) {
            dropdown.addEventListener('hide.bs.dropdown', function() {
                setTimeout(() => {
                    calculateLoanValues();
                }, 100);
            });
        }
        
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