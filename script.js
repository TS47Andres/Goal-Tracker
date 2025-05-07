// Initialize Charts
let goalTypeChart;
let progressChart;

// DOM Elements
const goalModal = document.getElementById('goal-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const goalForm = document.getElementById('goal-form');
const goalsList = document.getElementById('goals-list');
const modalTitle = document.getElementById('modal-title');
const addGoalBtn = document.getElementById('add-goal-btn');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const closeConfirmBtn = document.getElementById('close-confirmation');
const cancelConfirmBtn = document.getElementById('cancel-confirmation-btn');
const confirmActionBtn = document.getElementById('confirm-action-btn');
const categoryButtons = document.querySelectorAll('.cat-btn');
const totalGoalsEl = document.getElementById('total-goals');
const completedGoalsEl = document.getElementById('completed-goals');
const inProgressGoalsEl = document.getElementById('in-progress-goals');

// Goal Types and Icons
const goalTypeIcons = {
    'Learning': 'fas fa-book',
    'MCA': 'fas fa-graduation-cap',
    'Projects': 'fas fa-project-diagram',
    'Money': 'fas fa-dollar-sign',
    'Health': 'fas fa-heartbeat'
};

// Colors for charts and UI
const colors = {
'Learning': 'rgba(52, 152, 219, 0.8)',       // Bright Blue
  'MCA': 'rgba(231, 76, 60, 0.8)',             // Strong Red
  'Projects': 'rgba(46, 204, 113, 0.8)',       // Bright Green
  'Money': 'rgba(241, 196, 15, 0.8)',          // Golden Yellow
  'Health': 'rgba(155, 89, 182, 0.8)',         // Deep Purple
  'completed': 'rgba(74, 222, 128, 0.8)',      // Light Green
  'in-progress': 'rgba(96, 165, 250, 0.8)',    // Light Blue
  'overdue': 'rgba(239, 68, 68, 0.8)'          // Light Red 
};

// State
let goals = [];
let currentFilter = 'all';
let goalToDelete = null;

// Local Storage
const STORAGE_KEY = 'goal-tracker-2025';

// Load goals from localStorage
function loadGoals() {
    const savedGoals = localStorage.getItem(STORAGE_KEY);
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    }
}

// Save goals to localStorage
function saveGoals() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Calculate days remaining / overdue
function calculateDaysRemaining(goalDate, completionDate = null) {
    if (completionDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(goalDate);
    target.setHours(0, 0, 0, 0);
    
    const timeDiff = target.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Calculate early or late by days
function calculateEarlyLateByDays(goalDate, completionDate) {
    if (!completionDate) return null;
    
    const goal = new Date(goalDate);
    goal.setHours(0, 0, 0, 0);
    
    const completion = new Date(completionDate);
    completion.setHours(0, 0, 0, 0);
    
    const timeDiff = goal.getTime() - completion.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Get goal status
function getGoalStatus(goal) {
    if (goal.completionDate) {
        return 'completed';
    }
    
    const daysRemaining = calculateDaysRemaining(goal.goalDate);
    return daysRemaining < 0 ? 'overdue' : 'in-progress';
}

// Get goal status text
function getGoalStatusText(goal) {
    const status = getGoalStatus(goal);
    
    if (status === 'completed') {
        const earlyLate = calculateEarlyLateByDays(goal.goalDate, goal.completionDate);
        if (earlyLate > 0) {
            return `Completed ${earlyLate} days early`;
        } else if (earlyLate < 0) {
            return `Completed ${Math.abs(earlyLate)} days late`;
        } else {
            return 'Completed on time';
        }
    } else if (status === 'overdue') {
        return `Overdue by ${Math.abs(calculateDaysRemaining(goal.goalDate))} days`;
    } else {
        return `${calculateDaysRemaining(goal.goalDate)} days remaining`;
    }
}

// Filter goals
function filterGoals(category) {
    if (category === 'all') {
        return [...goals];
    }
    return goals.filter(goal => goal.type === category);
}

// Sort goals
function sortGoals(goalsToSort) {
    return goalsToSort.sort((a, b) => {
        // First sort by completion status (incomplete first)
        if (a.completionDate && !b.completionDate) return 1;
        if (!a.completionDate && b.completionDate) return -1;
        
        // If both are completed or both are incomplete, sort by days remaining
        if (!a.completionDate && !b.completionDate) {
            const aDays = calculateDaysRemaining(a.goalDate);
            const bDays = calculateDaysRemaining(b.goalDate);
            
            // Sort by days remaining (ascending)
            return aDays - bDays;
        }
        
        // If both are completed, sort by completion date (latest first)
        return new Date(b.completionDate) - new Date(a.completionDate);
    });
}

// Render goals list
function renderGoals() {
    // Filter and sort goals
    const filteredGoals = filterGoals(currentFilter);
    const sortedGoals = sortGoals(filteredGoals);
    
    // Clear existing list
    goalsList.innerHTML = '';
    
    // Show empty state if no goals
    if (sortedGoals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>${currentFilter === 'all' ? 'No goals added yet. Click "Add Goal" to get started!' : 'No goals in this category yet.'}</p>
            </div>
        `;
        return;
    }
    
    // Render each goal
    sortedGoals.forEach(goal => {
        const status = getGoalStatus(goal);
        const statusText = getGoalStatusText(goal);
        
        const goalCard = document.createElement('div');
        goalCard.className = `goal-card ${status}`;
        goalCard.innerHTML = `
            <div class="goal-type">
                <i class="${goalTypeIcons[goal.type]}"></i> ${goal.type}
            </div>
            <h3 class="goal-title">${goal.task}</h3>
            <div class="goal-info">
                <div class="goal-dates">
                    <div class="goal-date-item">
                        <span class="goal-date-label">Target Date</span>
                        <span class="goal-date-value">${formatDate(goal.goalDate)}</span>
                    </div>
                    <div class="goal-date-item">
                        <span class="goal-date-label">Completion Date</span>
                        <span class="goal-date-value">${formatDate(goal.completionDate)}</span>
                    </div>
                </div>
                <div class="goal-status">
                    <span class="status-indicator ${status}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
            <div class="goal-actions">
                ${!goal.completionDate ? `
                    <button class="action-btn complete-btn" data-id="${goal.id}" title="Mark as Complete">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="action-btn edit-btn" data-id="${goal.id}" title="Edit Goal">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${goal.id}" title="Delete Goal">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        goalsList.appendChild(goalCard);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editGoal(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => showDeleteConfirmation(btn.dataset.id));
    });
    
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', () => markGoalComplete(btn.dataset.id));
    });
}

// Update statistics
function updateStats() {
    const total = goals.length;
    const completed = goals.filter(goal => goal.completionDate).length;
    const inProgress = total - completed;
    
    totalGoalsEl.textContent = total;
    completedGoalsEl.textContent = completed;
    inProgressGoalsEl.textContent = inProgress;
}

// Update charts
function updateCharts() {
    // Destroy existing charts if they exist
    if (goalTypeChart) goalTypeChart.destroy();
    if (progressChart) progressChart.destroy();
    
    // Goal Type Chart
    const goalTypeCtx = document.getElementById('goalTypeChart').getContext('2d');
    const goalTypeData = {};
    
    // Count goals by type
    goals.forEach(goal => {
        if (!goalTypeData[goal.type]) {
            goalTypeData[goal.type] = 0;
        }
        goalTypeData[goal.type]++;
    });
    
    // Create chart data
    const typeLabels = Object.keys(goalTypeData);
    const typeData = Object.values(goalTypeData);
    const typeColors = typeLabels.map(type => colors[type]);
    
    goalTypeChart = new Chart(goalTypeCtx, {
        type: 'doughnut',
        data: {
            labels: typeLabels,
            datasets: [{
                data: typeData,
                backgroundColor: typeColors,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Goals by Type',
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: {
                        family: 'Lexend',
                        size: 16,
                        weight: 600
                    }
                }
            }
        }
    });
    
    // Progress Chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    
    // Count goals by status
    const completed = goals.filter(goal => goal.completionDate).length;
    const overdue = goals.filter(goal => !goal.completionDate && calculateDaysRemaining(goal.goalDate) < 0).length;
    const inProgress = goals.length - completed - overdue;
    
    progressChart = new Chart(progressCtx, {
        type: 'bar',
        data: {
            labels: ['Completed', 'In Progress', 'Overdue'],
            datasets: [{
                data: [completed, inProgress, overdue],
                backgroundColor: [
                    colors.completed,
                    colors['in-progress'],
                    colors.overdue
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Goals Progress',
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: {
                        family: 'Lexend',
                        size: 16,
                        weight: 600
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: 'Poppins'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: 'Poppins'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Show goal modal for adding
function showAddGoalModal() {
    // Reset form
    goalForm.reset();
    document.getElementById('goal-id').value = '';
    
    // Update modal title
    modalTitle.textContent = 'Add New Goal';
    
    // Hide completion date field for new goals
    document.getElementById('completion-date-group').style.display = 'none';
    
    // Show modal
    goalModal.classList.add('active');
}

// Show goal modal for editing
function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Fill form with goal data
    document.getElementById('goal-id').value = goal.id;
    document.getElementById('goal-type').value = goal.type;
    document.getElementById('goal-task').value = goal.task;
    document.getElementById('goal-date').value = goal.goalDate;
    document.getElementById('completion-date').value = goal.completionDate || '';
    
    // Show completion date field for editing
    document.getElementById('completion-date-group').style.display = 'block';
    
    // Update modal title
    modalTitle.textContent = 'Edit Goal';
    
    // Show modal
    goalModal.classList.add('active');
}

// Hide goal modal
function hideGoalModal() {
    goalModal.classList.remove('active');
}

// Show delete confirmation modal
function showDeleteConfirmation(goalId) {
    goalToDelete = goalId;
    confirmationModal.classList.add('active');
}

// Hide confirmation modal
function hideConfirmationModal() {
    confirmationModal.classList.remove('active');
    goalToDelete = null;
}

// Delete goal
function deleteGoal() {
    if (!goalToDelete) return;
    
    const goalIndex = goals.findIndex(g => g.id === goalToDelete);
    if (goalIndex !== -1) {
        const deletedGoal = goals[goalIndex];
        goals.splice(goalIndex, 1);
        saveGoals();
        updateUI();
        showToast('success', 'Goal Deleted', `'${deletedGoal.task}' has been deleted.`);
    }
    
    hideConfirmationModal();
}

// Mark goal as complete
function markGoalComplete(goalId) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
        // Set completion date to today
        const today = new Date().toISOString().split('T')[0];
        goals[goalIndex].completionDate = today;
        
        saveGoals();
        updateUI();
        
        const completedGoal = goals[goalIndex];
        showToast('success', 'Goal Completed', `'${completedGoal.task}' has been marked as complete.`);
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const goalId = document.getElementById('goal-id').value;
    const type = document.getElementById('goal-type').value;
    const task = document.getElementById('goal-task').value;
    const goalDate = document.getElementById('goal-date').value;
    const completionDate = document.getElementById('completion-date').value || null;
    
    if (!type || !task || !goalDate) {
        showToast('error', 'Invalid Input', 'Please fill in all required fields.');
        return;
    }
    
    if (goalId) {
        // Update existing goal
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            goals[goalIndex] = {
                ...goals[goalIndex],
                type,
                task,
                goalDate,
                completionDate
            };
            showToast('success', 'Goal Updated', `'${task}' has been updated.`);
        }
    } else {
        // Add new goal
        const newGoal = {
            id: generateId(),
            type,
            task,
            goalDate,
            completionDate,
            createdAt: new Date().toISOString()
        };
        goals.push(newGoal);
        showToast('success', 'Goal Added', `'${task}' has been added.`);
    }
    
    saveGoals();
    updateUI();
    hideGoalModal();
}

// Filter goals by category
function filterByCategory(category) {
    currentFilter = category;
    
    // Update active button
    categoryButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderGoals();
}

// Show toast notification
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <h4 class="toast-title">${title}</h4>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Update all UI components
function updateUI() {
    renderGoals();
    updateStats();
    updateCharts();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load goals from localStorage
    loadGoals();
    
    // Initial UI render
    updateUI();
    
    // Add goal button
    addGoalBtn.addEventListener('click', showAddGoalModal);
    
    // Close modal buttons
    closeModalBtn.addEventListener('click', hideGoalModal);
    cancelBtn.addEventListener('click', hideGoalModal);
    
    // Close confirmation modal buttons
    closeConfirmBtn.addEventListener('click', hideConfirmationModal);
    cancelConfirmBtn.addEventListener('click', hideConfirmationModal);
    
    // Confirm delete button
    confirmActionBtn.addEventListener('click', deleteGoal);
    
    // Form submission
    goalForm.addEventListener('submit', handleFormSubmit);
    
    // Category filter buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === goalModal) {
            hideGoalModal();
        }
        if (e.target === confirmationModal) {
            hideConfirmationModal();
        }
    });
    
    // Add some animations to background particles
    animateParticles();
});

// Animate background particles
function animateParticles() {
    const particles = document.querySelector('.particles');
    
    // Create additional particle effects
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 3}px;
            height: ${Math.random() * 10 + 3}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float-particle ${Math.random() * 20 + 10}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
            opacity: ${Math.random() * 0.3 + 0.2};
        `;
        particles.appendChild(particle);
    }
    
    // Add CSS animation for particles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-particle {
            0%, 100% {
                transform: translate(0, 0);
            }
            25% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
            }
            50% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
            }
            75% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
            }
        }
    `;
    document.head.appendChild(style);
}