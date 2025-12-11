/**
 * Main application logic for NicoTracker
 * Handles UI interactions, view switching, and event listeners
 */

// Global state
let currentWizardStep = 1;
let wizardData = {
    source: null,
    quantity: null,
    strength: null,
    healthEffects: [],
    reason: null,
    otherReason: null
};

/**
 * Initialize the application
 */
function initApp() {
    // Initialize sample data if needed
    initializeSampleData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display initial data
    updateDashboard();
    updateAllCharts();
    
    // Set up navigation
    setupNavigation();
    
    // Ensure dashboard nav is active on load
    switchView('dashboardView');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Logo click to go to dashboard
    document.getElementById('logoContainer').addEventListener('click', () => {
        switchView('dashboardView');
    });
    
    // Navigation (both bottom nav and desktop nav)
    document.querySelectorAll('.nav-item, .nav-link').forEach(item => {
        item.addEventListener('click', (e) => {
            const viewId = e.currentTarget.dataset.view;
            switchView(viewId);
        });
    });
    
    // Settings and Info modals
    document.getElementById('settingsBtn').addEventListener('click', () => {
        openModal('settingsModal');
        loadSettingsIntoUI();
    });
    
    document.getElementById('infoBtn').addEventListener('click', () => {
        openModal('infoModal');
    });
    
    document.getElementById('closeSettings').addEventListener('click', () => {
        closeModal('settingsModal');
    });
    
    document.getElementById('closeInfo').addEventListener('click', () => {
        closeModal('infoModal');
    });
    
    // Log Intake button
    document.getElementById('logIntakeBtn').addEventListener('click', () => {
        openWizard();
    });
    
    // Wizard controls
    document.getElementById('closeWizard').addEventListener('click', () => {
        closeWizard();
    });
    
    document.getElementById('wizardNext').addEventListener('click', () => {
        nextWizardStep();
    });
    
    document.getElementById('wizardPrev').addEventListener('click', () => {
        prevWizardStep();
    });
    
    document.getElementById('wizardConfirm').addEventListener('click', () => {
        confirmWizard();
    });
    
    // Wizard step 1: Source selection
    document.querySelectorAll('input[name="source"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            wizardData.source = e.target.value;
            showQuantityInput();
            validateWizardStep(1);
        });
    });
    
    // Quantity input
    document.getElementById('quantity').addEventListener('input', (e) => {
        wizardData.quantity = parseInt(e.target.value) || null;
        updateEstimatedMg();
        validateWizardStep(1);
    });
    
    // Strength slider
    document.getElementById('strengthSlider').addEventListener('input', (e) => {
        wizardData.strength = parseFloat(e.target.value);
        document.getElementById('strengthValue').textContent = wizardData.strength.toFixed(1);
        updateEstimatedMg();
        validateWizardStep(1);
    });
    
    // Health effects checkboxes
    document.querySelectorAll('input[name="healthEffects"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                wizardData.healthEffects.push(e.target.value);
            } else {
                wizardData.healthEffects = wizardData.healthEffects.filter(v => v !== e.target.value);
            }
            validateWizardStep(2);
        });
    });
    
    // Reason radio buttons
    document.querySelectorAll('input[name="reason"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            wizardData.reason = e.target.value;
            if (e.target.value === 'Other') {
                document.getElementById('otherReasonGroup').style.display = 'block';
            } else {
                document.getElementById('otherReasonGroup').style.display = 'none';
                wizardData.otherReason = null;
            }
            validateWizardStep(3);
        });
    });
    
    // Other reason input
    document.getElementById('otherReason').addEventListener('input', (e) => {
        wizardData.otherReason = e.target.value;
        validateWizardStep(3);
    });
    
    // Cognitive check-in
    document.getElementById('focusSlider').addEventListener('input', (e) => {
        document.getElementById('focusValue').textContent = e.target.value;
    });
    
    document.getElementById('anxietySlider').addEventListener('input', (e) => {
        document.getElementById('anxietyValue').textContent = e.target.value;
    });
    
    document.getElementById('clearThinkingYes').addEventListener('click', () => {
        document.getElementById('clearThinkingYes').classList.add('active');
        document.getElementById('clearThinkingNo').classList.remove('active');
    });
    
    document.getElementById('clearThinkingNo').addEventListener('click', () => {
        document.getElementById('clearThinkingNo').classList.add('active');
        document.getElementById('clearThinkingYes').classList.remove('active');
    });
    
    document.getElementById('submitCognitiveBtn').addEventListener('click', () => {
        submitCognitiveCheckIn();
    });
    
    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        saveSettingsFromUI();
    });
    
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        exportData();
        showToast('Data exported successfully!');
    });
    
    document.getElementById('importDataBtn').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importData(file)
                .then(result => {
                    showToast(result.message);
                    updateDashboard();
                    updateAllCharts();
                    closeModal('settingsModal');
                })
                .catch(error => {
                    showToast(error.message || 'Failed to import data', 'error');
                });
        }
    });
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

/**
 * Set up navigation between views
 */
function setupNavigation() {
    // Already handled in setupEventListeners
}

/**
 * Switch between views
 * @param {string} viewId - ID of view to show
 */
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(viewId).classList.add('active');
    
    // Update navigation (both bottom nav and desktop nav)
    document.querySelectorAll('.nav-item, .nav-link').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewId) {
            item.classList.add('active');
        }
    });
    
    // Update charts if switching to analytics
    if (viewId === 'analyticsView') {
        setTimeout(() => {
            updateAllCharts();
        }, 100);
    }
}

/**
 * Update dashboard with current data
 */
function updateDashboard() {
    const logs = loadLogs();
    const settings = loadSettings();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's totals
    const todayLogs = logs.filter(log => log.date === today);
    const totalMgToday = todayLogs.reduce((sum, log) => sum + (log.estimatedMg || 0), 0);
    const eventCountToday = todayLogs.length;
    
    // Calculate percentage of daily limit
    const percentage = Math.min(100, (totalMgToday / settings.dailyMgLimit) * 100);
    
    // Update Body Battery ring
    updateBatteryRing(percentage);
    
    // Update status text and styling
    let status = 'Great Start';
    const ringProgress = document.querySelector('.ring-progress');
    const batteryStatus = document.getElementById('batteryStatus');
    const batteryPercentage = document.getElementById('batteryPercentage');
    
    if (percentage >= 100) {
        status = 'Over Limit';
        if (ringProgress) {
            ringProgress.style.stroke = '#ff4757';
            ringProgress.style.filter = 'url(#glow)';
        }
        batteryStatus.style.color = '#ff4757';
        batteryStatus.style.textShadow = '0 0 10px rgba(255, 71, 87, 0.8), 0 0 20px rgba(255, 71, 87, 0.4)';
        batteryPercentage.style.color = '#ff4757';
        batteryPercentage.style.textShadow = '0 0 8px rgba(255, 71, 87, 0.6), 0 0 15px rgba(255, 71, 87, 0.3)';
    } else if (percentage >= 80) {
        status = 'Approaching Limit';
        if (ringProgress) {
            ringProgress.style.stroke = '#ff6b35';
            ringProgress.style.filter = 'url(#glow)';
        }
        batteryStatus.style.color = '#ff6b35';
        batteryStatus.style.textShadow = '0 0 10px rgba(255, 107, 53, 0.8), 0 0 20px rgba(255, 107, 53, 0.4)';
        batteryPercentage.style.color = '#ff6b35';
        batteryPercentage.style.textShadow = '0 0 8px rgba(255, 107, 53, 0.6), 0 0 15px rgba(255, 107, 53, 0.3)';
    } else if (percentage >= 50) {
        status = 'Be Mindful';
        if (ringProgress) {
            ringProgress.style.stroke = '#00d4ff';
            ringProgress.style.filter = 'url(#glow)';
        }
        batteryStatus.style.color = '#00d4ff';
        batteryStatus.style.textShadow = '0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.4)';
        batteryPercentage.style.color = '#00d4ff';
        batteryPercentage.style.textShadow = '0 0 8px rgba(0, 212, 255, 0.6), 0 0 15px rgba(0, 212, 255, 0.3)';
    } else if (percentage > 0) {
        status = 'Within Limit';
        if (ringProgress) {
            ringProgress.style.stroke = '#00d4ff';
            ringProgress.style.filter = 'url(#glow)';
        }
        batteryStatus.style.color = '#00d4ff';
        batteryStatus.style.textShadow = '0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.4)';
        batteryPercentage.style.color = '#00d4ff';
        batteryPercentage.style.textShadow = '0 0 8px rgba(0, 212, 255, 0.6), 0 0 15px rgba(0, 212, 255, 0.3)';
    } else {
        status = 'Great Start';
        if (ringProgress) {
            ringProgress.style.stroke = '#00d4ff';
            ringProgress.style.filter = 'url(#glow)';
        }
        batteryStatus.style.color = '#00d4ff';
        batteryStatus.style.textShadow = '0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.4)';
        batteryPercentage.style.color = '#00d4ff';
        batteryPercentage.style.textShadow = '0 0 8px rgba(0, 212, 255, 0.6), 0 0 15px rgba(0, 212, 255, 0.3)';
    }
    
    batteryStatus.textContent = status;
    batteryPercentage.textContent = `${Math.round(percentage)}%`;
    
    // Update limit progress
    document.getElementById('limitValue').textContent = `${Math.round(totalMgToday)} / ${settings.dailyMgLimit} mg`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    
    // Update streak
    const streak = calculateStreak();
    document.getElementById('streakDays').textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
}

/**
 * Update the Body Battery ring animation
 * @param {number} percentage - Percentage (0-100)
 */
function updateBatteryRing(percentage) {
    const ring = document.querySelector('.ring-progress');
    if (!ring) return;
    
    const circumference = 2 * Math.PI * 85; // radius = 85
    const offset = circumference - (percentage / 100) * circumference;
    
    ring.style.strokeDashoffset = offset;
}

/**
 * Open the log intake wizard
 */
function openWizard() {
    currentWizardStep = 1;
    wizardData = {
        source: null,
        quantity: null,
        strength: 0,
        healthEffects: [],
        reason: null,
        otherReason: null
    };
    
    // Reset form
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('quantity').value = '';
    document.getElementById('strengthSlider').value = 0;
    document.getElementById('strengthValue').textContent = '0';
    document.getElementById('otherReason').value = '';
    document.getElementById('otherReasonGroup').style.display = 'none';
    document.getElementById('quantityGroup').style.display = 'none';
    document.getElementById('strengthGroup').style.display = 'none';
    
    showWizardStep(1);
    validateWizardStep(1); // Ensure buttons start in correct state
    openModal('wizardModal');
}

/**
 * Close the wizard
 */
function closeWizard() {
    closeModal('wizardModal');
}

/**
 * Show quantity input based on selected source
 */
function showQuantityInput() {
    const source = wizardData.source;
    if (!source) return;
    
    const quantityGroup = document.getElementById('quantityGroup');
    const strengthGroup = document.getElementById('strengthGroup');
    
    quantityGroup.style.display = 'block';
    strengthGroup.style.display = 'block';
    
    // Set appropriate label
    let label = 'Quantity';
    switch (source) {
        case 'Vape':
            label = 'Number of puffs';
            break;
        case 'Cigarettes':
            label = 'Number of cigarettes';
            break;
        case 'Snus':
            label = 'Number of portions';
            break;
    }
    document.getElementById('quantityLabel').textContent = label;
}

/**
 * Update estimated mg based on current wizard data
 */
function updateEstimatedMg() {
    if (!wizardData.source || !wizardData.quantity || !wizardData.strength) {
        return;
    }
    
    const estimatedMg = calculateEstimatedMg(
        wizardData.source,
        wizardData.quantity,
        wizardData.strength
    );
    
    // Store for later use
    wizardData.estimatedMg = estimatedMg;
}

/**
 * Show a specific wizard step
 * @param {number} step - Step number (1-4)
 */
function showWizardStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show selected step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update navigation buttons
    document.getElementById('wizardPrev').style.display = step > 1 ? 'block' : 'none';
    document.getElementById('wizardNext').style.display = step < 4 ? 'block' : 'none';
    document.getElementById('wizardConfirm').style.display = step === 4 ? 'block' : 'none';
    
    currentWizardStep = step;
    
    // Validate current step
    validateWizardStep(step);
    
    // Update confirmation step
    if (step === 4) {
        updateConfirmationStep();
    }
}

/**
 * Validate current wizard step
 * @param {number} step - Step number
 */
function validateWizardStep(step) {
    let isValid = false;
    
    switch (step) {
        case 1:
            isValid = wizardData.source !== null && 
                     wizardData.quantity !== null && 
                     wizardData.quantity > 0 &&
                     wizardData.strength > 0;
            break;
        case 2:
            isValid = wizardData.healthEffects.length > 0;
            break;
        case 3:
            isValid = wizardData.reason !== null && 
                     (wizardData.reason !== 'Other' || wizardData.otherReason);
            break;
        case 4:
            isValid = true;
            break;
    }
    
    const nextBtn = document.getElementById('wizardNext');
    const confirmBtn = document.getElementById('wizardConfirm');
    if (nextBtn) nextBtn.disabled = !isValid;
    if (confirmBtn) confirmBtn.disabled = !isValid;
}

/**
 * Move to next wizard step
 */
function nextWizardStep() {
    // Validate current step before proceeding
    validateWizardStep(currentWizardStep);
    const nextBtn = document.getElementById('wizardNext');
    if (nextBtn && nextBtn.disabled) {
        return; // Don't proceed if validation fails
    }
    
    if (currentWizardStep < 4) {
        showWizardStep(currentWizardStep + 1);
    }
}

/**
 * Move to previous wizard step
 */
function prevWizardStep() {
    if (currentWizardStep > 1) {
        showWizardStep(currentWizardStep - 1);
        validateWizardStep(currentWizardStep);
    }
}

/**
 * Update confirmation step with summary
 */
function updateConfirmationStep() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    document.getElementById('confirmTime').textContent = timeStr;
    document.getElementById('confirmSource').textContent = wizardData.source;
    document.getElementById('confirmQuantity').textContent = wizardData.quantity;
    document.getElementById('confirmStrength').textContent = `${wizardData.strength.toFixed(1)} mg`;
    document.getElementById('confirmEstimatedMg').textContent = `${wizardData.estimatedMg.toFixed(2)} mg`;
    document.getElementById('confirmHealthEffects').textContent = 
        wizardData.healthEffects.length > 0 
            ? wizardData.healthEffects.join(', ')
            : 'None';
    document.getElementById('confirmReason').textContent = 
        wizardData.reason === 'Other' 
            ? wizardData.otherReason 
            : wizardData.reason;
}

/**
 * Confirm and save wizard data
 */
function confirmWizard() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeOfDay = getTimeOfDay(now);
    
    const logData = {
        date: dateStr,
        timeOfDay: timeOfDay,
        source: wizardData.source,
        unitType: wizardData.source === 'Vape' ? 'puffs' : 
                  wizardData.source === 'Cigarettes' ? 'pieces' : 'pieces',
        amount: wizardData.quantity,
        estimatedMg: wizardData.estimatedMg,
        reason: wizardData.reason === 'Other' ? wizardData.otherReason : wizardData.reason,
        healthEffects: wizardData.healthEffects,
        focusLevel: null,
        anxietyLevel: null,
        clearThinking: null,
        notes: null
    };
    
    addLog(logData);
    
    closeWizard();
    updateDashboard();
    updateAllCharts();
    
    // Show encouraging message and redirect to cognitive view
    showToast('Intake logged! Now let\'s track how you feel 🧠');
    
    // Automatically redirect to Cognitive view after a short delay
    setTimeout(() => {
        switchView('cognitiveView');
    }, 800);
}

/**
 * Submit cognitive check-in
 */
function submitCognitiveCheckIn() {
    const focusLevel = parseInt(document.getElementById('focusSlider').value);
    const anxietyLevel = parseInt(document.getElementById('anxietySlider').value);
    const clearThinkingYes = document.getElementById('clearThinkingYes').classList.contains('active');
    const clearThinking = clearThinkingYes ? true : (document.getElementById('clearThinkingNo').classList.contains('active') ? false : null);
    const notes = document.getElementById('cognitiveNotes').value.trim() || null;
    
    // Get most recent log today
    let recentLog = getMostRecentLogToday();
    
    if (recentLog) {
        // Update existing log
        updateLog(recentLog.id, {
            focusLevel,
            anxietyLevel,
            clearThinking,
            notes
        });
    } else {
        // Create check-in-only record
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeOfDay = getTimeOfDay(now);
        
        addLog({
            date: dateStr,
            timeOfDay: timeOfDay,
            source: 'None',
            unitType: 'other',
            amount: 0,
            estimatedMg: 0,
            reason: 'Cognitive check-in only',
            healthEffects: [],
            focusLevel,
            anxietyLevel,
            clearThinking,
            notes
        });
    }
    
    // Reset form
    document.getElementById('focusSlider').value = 5;
    document.getElementById('focusValue').textContent = '5';
    document.getElementById('anxietySlider').value = 5;
    document.getElementById('anxietyValue').textContent = '5';
    document.getElementById('clearThinkingYes').classList.remove('active');
    document.getElementById('clearThinkingNo').classList.remove('active');
    document.getElementById('cognitiveNotes').value = '';
    
    updateDashboard();
    updateAllCharts();
    showToast('Cognitive check-in saved');
}

/**
 * Load settings into UI
 */
function loadSettingsIntoUI() {
    const settings = loadSettings();
    document.getElementById('dailyMgLimit').value = settings.dailyMgLimit;
    document.getElementById('dailyEventLimit').value = settings.dailyEventLimit;
}

/**
 * Save settings from UI
 */
function saveSettingsFromUI() {
    const settings = {
        dailyMgLimit: parseInt(document.getElementById('dailyMgLimit').value) || 40,
        dailyEventLimit: parseInt(document.getElementById('dailyEventLimit').value) || 5,
        morningLimitEnabled: false,
        timezoneOffsetMinutes: new Date().getTimezoneOffset()
    };
    
    saveSettings(settings);
    updateDashboard();
    closeModal('settingsModal');
    showToast('Settings saved');
}

/**
 * Open a modal
 * @param {string} modalId - ID of modal to open
 */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close a modal
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (default: 'success')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

