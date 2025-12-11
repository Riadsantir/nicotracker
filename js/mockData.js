/**
 * Mock data utilities for NicoTracker
 * Provides sample data for demonstration purposes
 */

/**
 * Generate sample log data
 * @returns {Array} Array of sample log objects
 */
function generateSampleLogs() {
    const now = new Date();
    const logs = [];
    
    // Generate logs for the past 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Morning log
        const morningTime = new Date(date);
        morningTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        logs.push({
            id: `sample-${dateStr}-morning`,
            timestamp: morningTime.toISOString(),
            date: dateStr,
            timeOfDay: 'morning',
            source: ['Vape', 'Cigarettes', 'Snus'][Math.floor(Math.random() * 3)],
            unitType: 'puffs',
            amount: Math.floor(Math.random() * 10) + 5,
            estimatedMg: Math.random() * 5 + 2,
            reason: 'Just woke up / habit',
            healthEffects: ['Alertness', 'Better focus'],
            focusLevel: Math.floor(Math.random() * 3) + 6,
            anxietyLevel: Math.floor(Math.random() * 3) + 2,
            clearThinking: true,
            notes: null
        });
        
        // Afternoon log (50% chance)
        if (Math.random() > 0.5) {
            const afternoonTime = new Date(date);
            afternoonTime.setHours(14 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            logs.push({
                id: `sample-${dateStr}-afternoon`,
                timestamp: afternoonTime.toISOString(),
                date: dateStr,
                timeOfDay: 'afternoon',
                source: ['Vape', 'Cigarettes', 'Snus'][Math.floor(Math.random() * 3)],
                unitType: 'puffs',
                amount: Math.floor(Math.random() * 8) + 3,
                estimatedMg: Math.random() * 4 + 1,
                reason: ['Stress', 'Studying / focus', 'Boredom'][Math.floor(Math.random() * 3)],
                healthEffects: ['Reduced stress', 'Better focus'],
                focusLevel: Math.floor(Math.random() * 4) + 5,
                anxietyLevel: Math.floor(Math.random() * 4) + 3,
                clearThinking: Math.random() > 0.3,
                notes: null
            });
        }
        
        // Evening log (30% chance)
        if (Math.random() > 0.7) {
            const eveningTime = new Date(date);
            eveningTime.setHours(18 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
            logs.push({
                id: `sample-${dateStr}-evening`,
                timestamp: eveningTime.toISOString(),
                date: dateStr,
                timeOfDay: 'evening',
                source: ['Vape', 'Cigarettes', 'Snus'][Math.floor(Math.random() * 3)],
                unitType: 'puffs',
                amount: Math.floor(Math.random() * 6) + 2,
                estimatedMg: Math.random() * 3 + 1,
                reason: ['Partying / social', 'Stress', 'Boredom'][Math.floor(Math.random() * 3)],
                healthEffects: ['Reduced stress'],
                focusLevel: Math.floor(Math.random() * 3) + 4,
                anxietyLevel: Math.floor(Math.random() * 3) + 4,
                clearThinking: Math.random() > 0.5,
                notes: null
            });
        }
    }
    
    return logs;
}

/**
 * Initialize sample data if localStorage is empty
 * Call this on first load to populate with demo data
 */
function initializeSampleData() {
    const existingLogs = loadLogs();
    if (existingLogs.length === 0) {
        const sampleLogs = generateSampleLogs();
        saveLogs(sampleLogs);
        return true;
    }
    return false;
}

