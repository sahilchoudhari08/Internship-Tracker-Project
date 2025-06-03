// DOM Elements
const internshipForm = document.getElementById('internshipForm');
const internshipsList = document.getElementById('internshipsList');
const emptyState = document.getElementById('emptyState');
const exportCsvBtn = document.getElementById('exportCsv');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const exportData = document.getElementById('exportData');
const clearData = document.getElementById('clearData');

// API endpoints
const API_URL = '/api/internships';

// Analytics functions
let statusChart = null;
let timelineChart = null;
let platformSuccessChart = null;
let lastUpdate = 0;
const UPDATE_THROTTLE = 1000; // Only update charts every second

// Dark/Light mode toggle logic
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeIconPath = document.getElementById('themeIconPath');

// Settings modal handlers
settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsModal.classList.remove('flex');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
    }
});

// Export all data handler
exportData.addEventListener('click', () => {
    exportToCSV();
});

// Clear all data handler
clearData.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchInternships();

                // 🔥 FIX: manually clear UI in case it's not reactive yet
                internshipsList.innerHTML = '';
                emptyState.classList.remove('hidden');
            } else {
                console.error('Failed to clear data:', await response.text());
            }
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }
});

function setTheme(mode) {
    if (mode === 'light') {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        themeIconPath.setAttribute('d', 'M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M12 7a5 5 0 000 10a5 5 0 000-10z'); // Sun
        themeToggle.setAttribute('aria-checked', 'false');
    } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        themeIconPath.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z'); // Moon
        themeToggle.setAttribute('aria-checked', 'true');
    }
    localStorage.setItem('theme', mode);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

themeToggle.addEventListener('click', toggleTheme);

// On load, set theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

function updateAnalytics(internships) {
    const now = Date.now();
    if (now - lastUpdate < UPDATE_THROTTLE) {
        return; // Skip update if too soon
    }
    lastUpdate = now;

    // Update stats immediately
    updateStats(internships);
    
    // Debounce chart updates
    requestAnimationFrame(() => {
        updateCharts(internships);
    });
}

function updateStats(internships) {
    const total = internships.length;
    const interviews = internships.filter(i => i.status === 'Interview').length;
    const offers = internships.filter(i => i.status === 'Offer').length;
    
    // Calculate rates
    const interviewRate = total > 0 ? ((interviews / total) * 100).toFixed(1) : 0;
    const offerRate = total > 0 ? ((offers / total) * 100).toFixed(1) : 0;
    
    // Calculate average response time (time between application and status change)
    const responseTimes = internships
        .filter(i => i.status !== 'Applied')
        .map(i => {
            const appliedDate = new Date(i.deadline);
            const statusChangeDate = new Date();
            return Math.floor((statusChangeDate - appliedDate) / (1000 * 60 * 60 * 24));
        });
    
    const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
        : 0;

    // Update DOM
    document.getElementById('totalApplications').textContent = total;
    document.getElementById('interviewRate').textContent = `${interviewRate}%`;
    document.getElementById('offerRate').textContent = `${offerRate}%`;
    document.getElementById('avgResponseTime').textContent = `${avgResponseTime} days`;
}

function updateCharts(internships) {
    if (!document.getElementById('statusChart') || !document.getElementById('timelineChart')) {
        return; // Don't update if charts aren't in view
    }

    updateStatusChart(internships);
    updateTimelineChart(internships);
    updatePlatformSuccessList(internships);
}

// Helper to get theme-based chart colors
function getChartColors() {
    const isLight = document.body.classList.contains('light');
    return {
        axis: isLight ? '#1e293b' : '#e2e8f0',
        grid: isLight ? 'rgba(30,41,59,0.08)' : 'rgba(255,255,255,0.1)',
        legend: isLight ? '#1e293b' : '#e2e8f0',
        tooltipBg: isLight ? '#1e293b' : 'rgba(30,41,59,0.9)',
        tooltipTitle: isLight ? '#f8fafc' : '#e2e8f0',
        tooltipBody: isLight ? '#f8fafc' : '#e2e8f0',
        tooltipBorder: isLight ? 'rgba(30,41,59,0.15)' : 'rgba(255,255,255,0.1)'
    };
}

function updateStatusChart(internships) {
    const statusCounts = {
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0
    };
    internships.forEach(i => statusCounts[i.status]++);
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (statusChart) statusChart.destroy();
    const chartColors = getChartColors();
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: 'rgba(30, 41, 59, 0.8)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: { duration: 500 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartColors.legend,
                        font: { family: 'Inter' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    titleColor: chartColors.tooltipTitle,
                    bodyColor: chartColors.tooltipBody,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

function updateTimelineChart(internships) {
    const dateCounts = {};
    internships.forEach(i => {
        const date = new Date(i.deadline);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });
    const monthCounts = {};
    internships.forEach(i => {
        const date = new Date(i.deadline);
        const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthCounts[monthStr] = (monthCounts[monthStr] || 0) + 1;
    });
    const ctx = document.getElementById('timelineChart').getContext('2d');
    if (timelineChart) timelineChart.destroy();
    const chartColors = getChartColors();
    timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dateCounts),
            datasets: [{
                label: 'Applications per Day',
                data: Object.values(dateCounts),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 24,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: { duration: 500 },
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    titleColor: chartColors.tooltipTitle,
                    bodyColor: chartColors.tooltipBody,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: function(context) { return `Date: ${context[0].label}`; },
                        label: function(context) { return `Applications: ${context.parsed.y}`; }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.axis, precision: 0 },
                    title: { display: true, text: 'Applications per Day', color: chartColors.axis }
                },
                x: {
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.axis, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Add monthly summary directly beneath the timeline chart
    let summaryDiv = document.getElementById('monthlySummary');
    if (!summaryDiv) {
        summaryDiv = document.createElement('div');
        summaryDiv.id = 'monthlySummary';
        summaryDiv.className = 'mt-6 text-lg text-slate-200';
        const timelineChartCanvas = document.getElementById('timelineChart');
        timelineChartCanvas.parentNode.insertBefore(summaryDiv, timelineChartCanvas.nextSibling);
    }
    summaryDiv.style.padding = '1rem 1.5rem';
    summaryDiv.style.margin = '0.5rem 0 0.5rem 0';
    summaryDiv.style.borderRadius = '0.75rem';
    summaryDiv.innerHTML = '<strong>Applications per Month:</strong><br>' +
        Object.entries(monthCounts)
            .map(([month, count]) => `${month}: <span class="font-bold">${count}</span> application${count === 1 ? '' : 's'}`)
            .join('<br>');
}

function updatePlatformSuccessList(internships) {
    const allPlatforms = ['LinkedIn', 'Handshake', 'Indeed', 'Company Site', 'Email', 'Other'];
    const platformCounts = {};
    const offerCounts = {};
    internships.forEach(i => {
        const platform = i.platform || 'Other';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        if (i.status === 'Offer') {
            offerCounts[platform] = (offerCounts[platform] || 0) + 1;
        }
    });
    const listDiv = document.getElementById('platformSuccessList');
    listDiv.innerHTML = '';
    allPlatforms.forEach(platform => {
        const rate = platformCounts[platform] ? ((offerCounts[platform] || 0) / platformCounts[platform] * 100).toFixed(1) : 0;
        const color = {
            'LinkedIn': 'text-indigo-400',
            'Handshake': 'text-amber-400',
            'Indeed': 'text-emerald-400',
            'Company Site': 'text-blue-400',
            'Email': 'text-purple-400',
            'Other': 'text-red-400'
        }[platform] || 'text-slate-300';
        listDiv.innerHTML += `<div class="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700/50">
            <span class="font-medium ${color}">${platform}</span>
            <span class="font-semibold text-slate-200">${rate}%</span>
        </div>`;
    });
}

// Helper function to get consistent colors for statuses
function getStatusColor(status, alpha = 1) {
    const colors = {
        Applied: `rgba(99, 102, 241, ${alpha})`,    // Indigo
        Interview: `rgba(245, 158, 11, ${alpha})`,   // Amber
        Offer: `rgba(16, 185, 129, ${alpha})`,       // Emerald
        Rejected: `rgba(239, 68, 68, ${alpha})`      // Red
    };
    return colors[status] || `rgba(99, 102, 241, ${alpha})`;
}

// Fetch all internships
async function fetchInternships() {
    try {
        const response = await fetch(API_URL);
        const internships = await response.json();
        
        // Update UI first
        displayInternships(internships);
        
        // Then update analytics with a slight delay
        setTimeout(() => {
            updateAnalytics(internships);
        }, 100);
    } catch (error) {
        console.error('Error fetching internships:', error);
    }
}

// Display internships in the UI
function displayInternships(internships) {
    if (internships.length === 0) {
        emptyState.classList.remove('hidden');
        internshipsList.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');
    internshipsList.innerHTML = '';

    // Sort internships by deadline
    internships.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Create main cards section as a responsive grid that fills each row with fixed-size cards
    const cardsSection = document.createElement('div');
    cardsSection.className = 'grid gap-6';
    cardsSection.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
    internships.forEach(internship => {
        const card = createInternshipCard(internship);
        // Remove any width/max-width classes from the card
        card.classList.remove('w-full', 'max-w-md', 'mx-auto');
        cardsSection.appendChild(card);
    });
    internshipsList.appendChild(cardsSection);

    // Create status categories section in a separate container
    const statusCategoriesContainer = document.createElement('div');
    statusCategoriesContainer.className = 'mt-12';
    statusCategoriesContainer.innerHTML = `
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 class="text-2xl font-bold text-slate-200 mb-6">Applications by Status</h2>
            <div class="space-y-6">
                ${Object.entries({
                    Applied: { color: 'indigo', icon: '📝' },
                    Interview: { color: 'amber', icon: '🎯' },
                    Offer: { color: 'emerald', icon: '✨' },
                    Rejected: { color: 'red', icon: '❌' }
                }).map(([status, { color, icon }]) => {
                    const companies = internships
                        .filter(i => i.status === status)
                        .map(i => i.company);

                    if (companies.length === 0) return '';

                    return `
                        <div class="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 w-full">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="text-2xl">${icon}</span>
                                <h3 class="text-xl font-semibold text-slate-200">${status}</h3>
                                <span class="px-3 py-1 rounded-full text-sm font-medium bg-${color}-500/20 text-${color}-400">
                                    ${companies.length} ${companies.length === 1 ? 'company' : 'companies'}
                                </span>
                            </div>
                            <div class="flex flex-row flex-wrap gap-3 justify-start w-full">
                                ${companies.map(company => `
                                    <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                        <p class="text-slate-200">${company}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Insert the status categories section after the internships list
    internshipsList.parentNode.insertBefore(statusCategoriesContainer, internshipsList.nextSibling);
}

// Create an internship card element
function createInternshipCard(internship) {
    const card = document.createElement('div');
    card.className = 'internship-card bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50';
    
    const appliedDate = new Date(internship.deadline);
    const daysSinceApplied = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));
    
    card.innerHTML = `
        <div class="flex flex-wrap justify-between items-start gap-y-2 mb-4">
            <div>
                <h3 class="text-xl font-semibold text-slate-200 mb-1">${internship.company}</h3>
                <p class="text-slate-400">${internship.role}</p>
                <p class="text-xs text-slate-500 mt-1">Platform: <span class="font-semibold">${internship.platform || 'N/A'}</span></p>
                <p class="text-xs text-slate-500 mt-1">Location: <span class="font-semibold">${internship.location || 'N/A'}</span></p>
            </div>
            <span class="status-badge status-${internship.status.toLowerCase()}">${internship.status}</span>
        </div>
        <div class="space-y-3">
            <div class="flex items-center text-sm text-slate-400">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>
                    Applied ${daysSinceApplied} days ago
                </span>
            </div>
            ${internship.notes ? `
                <div class="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p class="whitespace-pre-wrap">${internship.notes}</p>
                </div>
            ` : ''}
        </div>
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
            <select class="status-select text-sm rounded-lg border-slate-700" data-id="${internship.id}">
                <option value="Applied" ${internship.status === 'Applied' ? 'selected' : ''}>Applied</option>
                <option value="Interview" ${internship.status === 'Interview' ? 'selected' : ''}>Interview</option>
                <option value="Offer" ${internship.status === 'Offer' ? 'selected' : ''}>Offer</option>
                <option value="Rejected" ${internship.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
            <button class="delete-btn text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg" data-id="${internship.id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `;

    // Add event listeners
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteInternship(internship.id));

    const statusSelect = card.querySelector('.status-select');
    statusSelect.addEventListener('change', (e) => updateStatus(internship.id, e.target.value));

    // Add entrance animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 50);

    return card;
}

// Add new internship
async function addInternship(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const internship = {
        company: formData.get('company'),
        role: formData.get('role'),
        platform: formData.get('platform'),
        location: formData.get('location'),
        status: formData.get('status'),
        deadline: formData.get('deadline'),
        notes: formData.get('notes')
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(internship)
        });

        if (response.ok) {
            event.target.reset();
            fetchInternships();
        }
    } catch (error) {
        console.error('Error adding internship:', error);
    }
}

// Delete internship
async function deleteInternship(id) {
    if (!confirm('Are you sure you want to delete this internship?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchInternships();
        }
    } catch (error) {
        console.error('Error deleting internship:', error);
    }
}

// Update internship status
async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            fetchInternships();
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Export to CSV
function exportToCSV() {
    fetch(API_URL)
        .then(response => response.json())
        .then(internships => {
            const headers = ['Company', 'Role', 'Platform', 'Location', 'Status', 'Deadline', 'Notes'];
            const csvContent = [
                headers.join(','),
                ...internships.map(i => [
                    i.company,
                    i.role,
                    i.platform,
                    i.location,
                    i.status,
                    i.deadline,
                    i.notes
                ].map(field => `"${field || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'internships.csv';
            link.click();
        })
        .catch(error => console.error('Error exporting to CSV:', error));
}

// Event Listeners
internshipForm.addEventListener('submit', addInternship);
exportCsvBtn.addEventListener('click', exportToCSV);

// Re-render charts on theme change
function rerenderChartsOnThemeChange() {
    fetchInternships(); // This will call updateCharts with the new theme
}
themeToggle.addEventListener('click', rerenderChartsOnThemeChange);

// Initial load
fetchInternships();
