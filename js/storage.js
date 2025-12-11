/**
 * Storage utilities for NicoTracker
 * Handles all localStorage operations, import/export functionality
 */

const STORAGE_KEYS = {
    LOGS: 'nicotracker_logs',
    SETTINGS: 'nicotracker_settings'
};

const DEFAULT_SETTINGS = {
    dailyMgLimit: 40,
    dailyEventLimit: 5,
    morningLimitEnabled: false,
    timezoneOffsetMinutes: new Date().getTimezoneOffset()
};

/**
 * Load all nicotine logs from localStorage
 * @returns {Array} Array of log objects
 */
function loadLogs() {
    try {
        const logsJson = localStorage.getItem(STORAGE_KEYS.LOGS);
        if (!logsJson) return [];
        return JSON.parse(logsJson);
    } catch (error) {
        console.error('Error loading logs:', error);
        return [];
    }
}

/**
 * Save all nicotine logs to localStorage
 * @param {Array} logs - Array of log objects to save
 */
function saveLogs(logs) {
    try {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (error) {
        console.error('Error saving logs:', error);
        throw new Error('Failed to save logs');
    }
}

/**
 * Add a new log entry
 * @param {Object} logData - Log object to add
 * @returns {Object} The saved log with generated ID
 */
function addLog(logData) {
    const logs = loadLogs();
    const newLog = {
        ...logData,
        id: generateId(),
        timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    saveLogs(logs);
    return newLog;
}

/**
 * Update an existing log entry
 * @param {string} logId - ID of log to update
 * @param {Object} updates - Partial log object with fields to update
 */
function updateLog(logId, updates) {
    const logs = loadLogs();
    const index = logs.findIndex(log => log.id === logId);
    if (index === -1) {
        throw new Error('Log not found');
    }
    logs[index] = { ...logs[index], ...updates };
    saveLogs(logs);
    return logs[index];
}

/**
 * Get the most recent log entry for today
 * @returns {Object|null} Most recent log or null
 */
function getMostRecentLogToday() {
    const logs = loadLogs();
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.date === today);
    if (todayLogs.length === 0) return null;
    return todayLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
}

/**
 * Load user settings from localStorage
 * @returns {Object} Settings object
 */
function loadSettings() {
    try {
        const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!settingsJson) {
            return { ...DEFAULT_SETTINGS };
        }
        return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Save user settings to localStorage
 * @param {Object} settings - Settings object to save
 */
function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
        throw new Error('Failed to save settings');
    }
}

/**
 * Export all data (logs + settings) as JSON file
 */
function exportData() {
    try {
        const logs = loadLogs();
        const settings = loadSettings();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            logs,
            settings
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nicotracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error exporting data:', error);
        throw new Error('Failed to export data');
    }
}

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Result object with success status and message
 */
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate structure
                if (!importedData.logs || !Array.isArray(importedData.logs)) {
                    throw new Error('Invalid file format: missing logs array');
                }
                
                // Merge logs (avoid duplicates by ID)
                const existingLogs = loadLogs();
                const existingIds = new Set(existingLogs.map(log => log.id));
                const newLogs = importedData.logs.filter(log => !existingIds.has(log.id));
                const mergedLogs = [...existingLogs, ...newLogs];
                saveLogs(mergedLogs);
                
                // Merge settings if provided
                if (importedData.settings) {
                    const currentSettings = loadSettings();
                    const mergedSettings = { ...currentSettings, ...importedData.settings };
                    saveSettings(mergedSettings);
                }
                
                resolve({
                    success: true,
                    message: `Imported ${newLogs.length} new log entries`
                });
            } catch (error) {
                reject({
                    success: false,
                    message: error.message || 'Failed to import data'
                });
            }
        };
        reader.onerror = () => {
            reject({
                success: false,
                message: 'Failed to read file'
            });
        };
        reader.readAsText(file);
    });
}

/**
 * Generate a unique ID for log entries
 * @returns {string} Unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get time of day category based on hour
 * @param {Date} date - Date object
 * @returns {string} Time of day category
 */
function getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

/**
 * Calculate estimated mg of nicotine based on source, quantity, and strength
 * @param {string} source - Source type (Vape, Cigarettes, Snus)
 * @param {number} quantity - Quantity consumed
 * @param {number} strength - Nicotine strength in mg
 * @returns {number} Estimated mg of nicotine
 */
function calculateEstimatedMg(source, quantity, strength) {
    if (!quantity || quantity <= 0) return 0;
    if (!strength || strength <= 0) return 0;
    
    // For vape: strength is per ml, assume ~200 puffs per ml
    // For cigarettes: strength is per cigarette
    // For snus: strength is per portion
    
    switch (source) {
        case 'Vape':
            // Assume user enters puffs, and strength is mg/ml
            // Rough estimate: 1 ml = ~200 puffs, so mg per puff = strength / 200
            return (strength / 200) * quantity;
        case 'Cigarettes':
            // Strength is mg per cigarette
            return strength * quantity;
        case 'Snus':
            // Strength is mg per portion
            return strength * quantity;
        default:
            return 0;
    }
}

/**
 * Get logs for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Array} Array of logs for that date
 */
function getLogsByDate(date) {
    const logs = loadLogs();
    return logs.filter(log => log.date === date);
}

/**
 * Get all logs within a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of logs in the date range
 */
function getLogsByDateRange(startDate, endDate) {
    const logs = loadLogs();
    return logs.filter(log => {
        return log.date >= startDate && log.date <= endDate;
    });
}

/**
 * Calculate streak of consecutive days with at least one log
 * @returns {number} Number of consecutive days
 */
function calculateStreak() {
    const logs = loadLogs();
    if (logs.length === 0) return 0;
    
    // Get unique dates that have logs
    const datesWithLogs = new Set(logs.map(log => log.date));
    const sortedDates = Array.from(datesWithLogs).sort().reverse();
    
    if (sortedDates.length === 0) return 0;
    
    // Check if today has a log
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check backwards from today
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (datesWithLogs.has(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

