/**
 * Charts and analytics utilities for NicoTracker
 * Handles chart rendering and data aggregation
 */

let focusAnxietyChart = null;

/**
 * Initialize and render the Focus vs Anxiety line chart
 * @param {Array} logs - Array of log objects
 */
function renderFocusAnxietyChart(logs) {
    const ctx = document.getElementById('focusAnxietyChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (focusAnxietyChart) {
        focusAnxietyChart.destroy();
    }
    
    // Group logs by time of day
    const timeGroups = {
        morning: { focus: [], anxiety: [] },
        afternoon: { focus: [], anxiety: [] },
        evening: { focus: [], anxiety: [] },
        night: { focus: [], anxiety: [] }
    };
    
    logs.forEach(log => {
        if (log.timeOfDay && log.focusLevel !== null && log.focusLevel !== undefined) {
            timeGroups[log.timeOfDay].focus.push(log.focusLevel);
        }
        if (log.timeOfDay && log.anxietyLevel !== null && log.anxietyLevel !== undefined) {
            timeGroups[log.timeOfDay].anxiety.push(log.anxietyLevel);
        }
    });
    
    // Calculate averages
    const labels = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const focusData = Object.values(timeGroups).map(group => {
        if (group.focus.length === 0) return null;
        return group.focus.reduce((a, b) => a + b, 0) / group.focus.length;
    });
    const anxietyData = Object.values(timeGroups).map(group => {
        if (group.anxiety.length === 0) return null;
        return group.anxiety.reduce((a, b) => a + b, 0) / group.anxiety.length;
    });
    
    focusAnxietyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avg Focus',
                    data: focusData,
                    borderColor: 'rgb(0, 212, 255)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Avg Anxiety',
                    data: anxietyData,
                    borderColor: 'rgb(255, 107, 53)',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#a0aec0',
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 39, 66, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#a0aec0',
                    borderColor: '#2d3748',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0aec0',
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        color: 'rgba(45, 55, 72, 0.5)'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        color: '#a0aec0',
                        font: {
                            family: 'Inter, sans-serif'
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(45, 55, 72, 0.5)'
                    }
                }
            }
        }
    });
}

/**
 * Compute sweet spot correlation matrix
 * Groups logs by nicotine dose buckets and time of day
 * @param {Array} logs - Array of log objects
 * @returns {Object} Matrix data with computed metrics
 */
function computeSweetSpotMatrix(logs) {
    // Define dose buckets (mg)
    const doseBuckets = [
        { min: 0, max: 5, label: '0-5 mg' },
        { min: 5, max: 10, label: '5-10 mg' },
        { min: 10, max: 15, label: '10-15 mg' },
        { min: 15, max: 20, label: '15-20 mg' },
        { min: 20, max: 999, label: '20+ mg' }
    ];
    
    // Define time buckets
    const timeBuckets = ['morning', 'afternoon', 'evening', 'night'];
    const timeLabels = ['6AM', '12PM', '6PM', '9PM'];
    
    // Initialize matrix
    const matrix = {};
    doseBuckets.forEach(bucket => {
        matrix[bucket.label] = {};
        timeBuckets.forEach(time => {
            matrix[bucket.label][time] = {
                focus: [],
                anxiety: [],
                count: 0
            };
        });
    });
    
    // Populate matrix with log data
    logs.forEach(log => {
        if (!log.estimatedMg || !log.timeOfDay) return;
        if (log.focusLevel === null || log.focusLevel === undefined) return;
        if (log.anxietyLevel === null || log.anxietyLevel === undefined) return;
        
        // Find matching dose bucket
        const doseBucket = doseBuckets.find(bucket => 
            log.estimatedMg >= bucket.min && log.estimatedMg < bucket.max
        );
        
        if (!doseBucket) return;
        
        const cell = matrix[doseBucket.label][log.timeOfDay];
        cell.focus.push(log.focusLevel);
        cell.anxiety.push(log.anxietyLevel);
        cell.count++;
    });
    
    // Calculate metrics for each cell
    const result = {
        doseBuckets: doseBuckets.map(b => b.label),
        timeBuckets: timeLabels,
        cells: []
    };
    
    doseBuckets.forEach((doseBucket, doseIdx) => {
        timeBuckets.forEach((time, timeIdx) => {
            const cell = matrix[doseBucket.label][time];
            let avgFocus = 0;
            let avgAnxiety = 0;
            let metric = 0; // Sweet spot score: higher focus, lower anxiety = better
            
            if (cell.count > 0) {
                avgFocus = cell.focus.reduce((a, b) => a + b, 0) / cell.focus.length;
                avgAnxiety = cell.anxiety.reduce((a, b) => a + b, 0) / cell.anxiety.length;
                // Metric: (focus - anxiety) normalized to 0-100
                // Focus is 1-10, anxiety is 1-10, so (focus - anxiety) ranges from -9 to 9
                // Normalize to 0-100: ((focus - anxiety) + 9) / 18 * 100
                metric = ((avgFocus - avgAnxiety) + 9) / 18 * 100;
                metric = Math.max(0, Math.min(100, metric)); // Clamp to 0-100
            }
            
            result.cells.push({
                doseIdx,
                timeIdx,
                doseLabel: doseBucket.label,
                timeLabel: timeLabels[timeIdx],
                avgFocus,
                avgAnxiety,
                metric,
                count: cell.count
            });
        });
    });
    
    return result;
}

/**
 * Render the sweet spot heatmap
 * @param {Array} logs - Array of log objects
 */
function renderSweetSpotHeatmap(logs) {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    
    const matrix = computeSweetSpotMatrix(logs);
    
    // Clear container
    container.innerHTML = '';
    
    // Create grid
    container.style.gridTemplateColumns = `auto repeat(${matrix.timeBuckets.length}, 1fr)`;
    container.style.gridTemplateRows = `auto repeat(${matrix.doseBuckets.length}, 1fr)`;
    
    // Add empty corner cell
    const cornerCell = document.createElement('div');
    cornerCell.className = 'heatmap-label';
    container.appendChild(cornerCell);
    
    // Add time labels (top row)
    matrix.timeBuckets.forEach(label => {
        const labelCell = document.createElement('div');
        labelCell.className = 'heatmap-label';
        labelCell.textContent = label;
        container.appendChild(labelCell);
    });
    
    // Add dose labels and cells
    matrix.doseBuckets.forEach((doseLabel, doseIdx) => {
        // Dose label
        const doseLabelCell = document.createElement('div');
        doseLabelCell.className = 'heatmap-label';
        doseLabelCell.textContent = doseLabel;
        container.appendChild(doseLabelCell);
        
        // Cells for this dose row
        matrix.timeBuckets.forEach((timeLabel, timeIdx) => {
            const cell = matrix.cells.find(c => c.doseIdx === doseIdx && c.timeIdx === timeIdx);
            const cellElement = document.createElement('div');
            cellElement.className = 'heatmap-cell';
            
            if (cell && cell.count > 0) {
                // Set background color based on metric
                // Higher metric (better sweet spot) = greener/brighter
                // Lower metric (worse) = redder/darker
                const hue = cell.metric * 1.2; // 0-120 (red to green)
                const saturation = 60 + (cell.metric / 100) * 40; // 60-100%
                const lightness = 30 + (cell.metric / 100) * 20; // 30-50%
                cellElement.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                cellElement.title = `${cell.doseLabel} @ ${cell.timeLabel}\nFocus: ${cell.avgFocus.toFixed(1)}\nAnxiety: ${cell.avgAnxiety.toFixed(1)}\nCount: ${cell.count}`;
            } else {
                cellElement.style.backgroundColor = 'var(--color-bg-tertiary)';
                cellElement.style.opacity = '0.3';
                cellElement.title = 'No data';
            }
            
            container.appendChild(cellElement);
        });
    });
}

/**
 * Get daily statistics for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {Array} logs - Array of all logs
 * @returns {Object} Daily statistics
 */
function getDailyStats(date, logs) {
    const dayLogs = logs.filter(log => log.date === date);
    
    const totalMg = dayLogs.reduce((sum, log) => sum + (log.estimatedMg || 0), 0);
    const eventCount = dayLogs.length;
    
    const focusLevels = dayLogs
        .map(log => log.focusLevel)
        .filter(level => level !== null && level !== undefined);
    const avgFocus = focusLevels.length > 0
        ? focusLevels.reduce((a, b) => a + b, 0) / focusLevels.length
        : null;
    
    const anxietyLevels = dayLogs
        .map(log => log.anxietyLevel)
        .filter(level => level !== null && level !== undefined);
    const avgAnxiety = anxietyLevels.length > 0
        ? anxietyLevels.reduce((a, b) => a + b, 0) / anxietyLevels.length
        : null;
    
    return {
        date,
        totalMg,
        eventCount,
        avgFocus,
        avgAnxiety,
        logs: dayLogs
    };
}

/**
 * Compute focus and anxiety averages by time buckets
 * @param {Array} logs - Array of log objects
 * @returns {Object} Bucketed data
 */
function computeFocusAnxietyBuckets(logs) {
    const buckets = {
        morning: { focus: [], anxiety: [] },
        afternoon: { focus: [], anxiety: [] },
        evening: { focus: [], anxiety: [] },
        night: { focus: [], anxiety: [] }
    };
    
    logs.forEach(log => {
        if (!log.timeOfDay) return;
        if (log.focusLevel !== null && log.focusLevel !== undefined) {
            buckets[log.timeOfDay].focus.push(log.focusLevel);
        }
        if (log.anxietyLevel !== null && log.anxietyLevel !== undefined) {
            buckets[log.timeOfDay].anxiety.push(log.anxietyLevel);
        }
    });
    
    // Calculate averages
    const result = {};
    Object.keys(buckets).forEach(time => {
        const bucket = buckets[time];
        result[time] = {
            avgFocus: bucket.focus.length > 0
                ? bucket.focus.reduce((a, b) => a + b, 0) / bucket.focus.length
                : null,
            avgAnxiety: bucket.anxiety.length > 0
                ? bucket.anxiety.reduce((a, b) => a + b, 0) / bucket.anxiety.length
                : null,
            count: Math.max(bucket.focus.length, bucket.anxiety.length)
        };
    });
    
    return result;
}

/**
 * Update all charts with current data
 */
function updateAllCharts() {
    const logs = loadLogs();
    renderFocusAnxietyChart(logs);
    renderSweetSpotHeatmap(logs);
}

