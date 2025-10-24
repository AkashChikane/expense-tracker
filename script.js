// Local Storage Keys
const STORAGE_KEYS = {
    EXPENSES: 'expenses',
    SALARY: 'monthlySalary'
};

// Category Icons
const CATEGORY_ICONS = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎬',
    bills: '📄',
    health: '💊',
    education: '📚',
    other: '📦'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForms();
    loadData();
    setDefaultDate();
});

// Tab Navigation
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Refresh data when switching to specific tabs
            if (tabName === 'history') {
                displayExpenses('all');
            } else if (tabName === 'trends') {
                displayTrends();
            }
        });
    });
}

// Form Initialization
function initializeForms() {
    // Expense Form
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });

    // Salary Form
    document.getElementById('salaryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateSalary();
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayExpenses(btn.dataset.filter);
        });
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Load Data
function loadData() {
    updateBalanceDisplay();
    displayExpenses('all');
    displayTrends();
    
    // Load saved salary
    const salary = getSalary();
    if (salary > 0) {
        document.getElementById('salary').value = salary;
    }
}

// Add Expense
function addExpense() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    const expense = {
        id: Date.now(),
        amount,
        category,
        description,
        date,
        timestamp: new Date().toISOString()
    };

    // Get existing expenses
    const expenses = getExpenses();
    expenses.push(expense);
    saveExpenses(expenses);

    // Reset form
    document.getElementById('expenseForm').reset();
    setDefaultDate();

    // Update display
    updateBalanceDisplay();
    displayExpenses('all');

    // Show success feedback
    showNotification('Expense added successfully! 🎉');
}

// Update Salary
function updateSalary() {
    const salary = parseFloat(document.getElementById('salary').value);
    if (salary && salary > 0) {
        localStorage.setItem(STORAGE_KEYS.SALARY, salary);
        updateBalanceDisplay();
        showNotification('Salary updated successfully! 💰');
    }
}

// Get Expenses from LocalStorage
function getExpenses() {
    const expenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return expenses ? JSON.parse(expenses) : [];
}

// Save Expenses to LocalStorage
function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

// Get Salary
function getSalary() {
    const salary = localStorage.getItem(STORAGE_KEYS.SALARY);
    return salary ? parseFloat(salary) : 0;
}

// Update Balance Display
function updateBalanceDisplay() {
    const salary = getSalary();
    const expenses = getExpenses();
    
    // Calculate current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = salary - totalSpent;

    document.getElementById('monthlyBudget').textContent = `₹${salary.toLocaleString('en-IN')}`;
    document.getElementById('totalSpent').textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
    document.getElementById('remaining').textContent = `₹${remaining.toLocaleString('en-IN')}`;
    
    // Change color based on remaining amount
    const remainingElement = document.getElementById('remaining');
    if (remaining < 0) {
        remainingElement.style.color = '#fca5a5';
    } else if (remaining < salary * 0.2) {
        remainingElement.style.color = '#fcd34d';
    } else {
        remainingElement.style.color = '#86efac';
    }
}

// Display Expenses
function displayExpenses(filter) {
    const expenses = getExpenses();
    const filteredExpenses = filterExpenses(expenses, filter);
    
    const expenseList = document.getElementById('expenseList');
    
    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No expenses found</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    expenseList.innerHTML = filteredExpenses.map(expense => `
        <div class="expense-item">
            <span class="expense-icon">${CATEGORY_ICONS[expense.category]}</span>
            <div class="expense-details">
                <div class="expense-description">${expense.description}</div>
                <div class="expense-meta">
                    ${getCategoryName(expense.category)} • ${formatDate(expense.date)}
                </div>
            </div>
            <div class="expense-amount-wrapper">
                <div class="expense-amount">₹${expense.amount.toLocaleString('en-IN')}</div>
                <button class="btn-danger" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Filter Expenses
function filterExpenses(expenses, filter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'today':
            return expenses.filter(exp => {
                const expDate = new Date(exp.date);
                expDate.setHours(0, 0, 0, 0);
                return expDate.getTime() === today.getTime();
            });
        
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return expenses.filter(exp => new Date(exp.date) >= weekAgo);
        
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return expenses.filter(exp => new Date(exp.date) >= monthStart);
        
        default:
            return expenses;
    }
}

// Delete Expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        let expenses = getExpenses();
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses(expenses);
        
        updateBalanceDisplay();
        displayExpenses(document.querySelector('.filter-btn.active').dataset.filter);
        displayTrends();
        
        showNotification('Expense deleted! 🗑️');
    }
}

// Display Trends
function displayTrends() {
    const expenses = getExpenses();
    
    // Calculate totals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);
        return expDate.getTime() === today.getTime();
    });
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekExpenses = expenses.filter(exp => new Date(exp.date) >= weekAgo);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthExpenses = expenses.filter(exp => new Date(exp.date) >= monthStart);
    
    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const weekTotal = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    document.getElementById('todayTotal').textContent = `₹${todayTotal.toLocaleString('en-IN')}`;
    document.getElementById('weekTotal').textContent = `₹${weekTotal.toLocaleString('en-IN')}`;
    document.getElementById('monthTotal').textContent = `₹${monthTotal.toLocaleString('en-IN')}`;
    
    // Category Breakdown
    displayCategoryBreakdown(monthExpenses);
}

// Display Category Breakdown
function displayCategoryBreakdown(expenses) {
    const categoryBreakdown = document.getElementById('categoryBreakdown');
    
    if (expenses.length === 0) {
        categoryBreakdown.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>No data to display yet</p>
            </div>
        `;
        return;
    }
    
    // Calculate category totals
    const categoryTotals = {};
    expenses.forEach(exp => {
        if (!categoryTotals[exp.category]) {
            categoryTotals[exp.category] = 0;
        }
        categoryTotals[exp.category] += exp.amount;
    });
    
    // Calculate total and percentages
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    // Sort by amount (highest first)
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    categoryBreakdown.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-icon">${CATEGORY_ICONS[category]}</span>
                    <div class="category-details">
                        <div class="category-name">${getCategoryName(category)}</div>
                        <div class="category-bar">
                            <div class="category-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="category-amount">₹${amount.toLocaleString('en-IN')}</span>
                    <span class="category-percentage">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// Helper Functions
function getCategoryName(category) {
    const names = {
        food: 'Food & Dining',
        transport: 'Transport',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        bills: 'Bills & Utilities',
        health: 'Health',
        education: 'Education',
        other: 'Other'
    };
    return names[category] || category;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expDate = new Date(dateString);
    expDate.setHours(0, 0, 0, 0);
    
    if (expDate.getTime() === today.getTime()) {
        return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (expDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showNotification(message) {
    // Simple notification - you can enhance this with a toast library
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
